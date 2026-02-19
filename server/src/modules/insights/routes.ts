import { Router } from "express";
import { db, persist } from "../../db/store";
import type { InsightAlert, InsightCategory, InsightSeverity } from "../../domain/types";
import { requireAuth, requirePermission, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

function computeClientInsights(clientId: string, orgId: string): Omit<InsightAlert, "id" | "createdAt">[] {
  const alerts: Omit<InsightAlert, "id" | "createdAt">[] = [];

  const profiles = db.data.financialProfiles
    .filter((p) => p.clientId === clientId && p.organizationId === orgId)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  const latest = profiles[0];
  if (!latest) return alerts;

  const client = db.data.clients.find((c) => c.id === clientId && c.organizationId === orgId);
  const riskSnaps = db.data.riskProfileSnapshots
    .filter((r) => r.clientId === clientId && r.organizationId === orgId)
    .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1));
  const latestRisk = riskSnaps[0];

  const { inputs } = latest;
  const totalRegistered = inputs.registered.reduce((s, r) => s + r.currentBalance, 0);
  const totalNonReg = inputs.nonRegistered.reduce((s, r) => s + r.currentBalance, 0);
  const totalAssets = inputs.assets.reduce((s, a) => s + a.currentValue, 0) + totalRegistered + totalNonReg;
  const cashAssets = inputs.assets.filter((a) => a.category === "cash").reduce((s, a) => s + a.currentValue, 0);
  const monthlyExpenses = (inputs.incomeExpense.annualEssentialExpenses + inputs.incomeExpense.annualDiscretionaryExpenses) / 12;

  // Allocation drift: if a single category >60% of total
  if (totalAssets > 0) {
    const realEstate = inputs.assets.filter((a) => a.category === "real_estate").reduce((s, a) => s + a.currentValue, 0);
    const investmentPct = (totalRegistered + totalNonReg) / totalAssets;
    const rePct = realEstate / totalAssets;
    if (investmentPct > 0.6 || rePct > 0.6) {
      const dominant = investmentPct > rePct ? "investment accounts" : "real estate";
      alerts.push(mkInsight(orgId, clientId, "allocation_drift", "warning",
        "Asset allocation concentration detected",
        `Over 60% of total assets concentrated in ${dominant}. Consider rebalancing.`,
        { dominant, pct: Math.round(Math.max(investmentPct, rePct) * 100) }));
    }
  }

  // Risk mismatch: conservative profile but aggressive allocation
  if (latestRisk && totalAssets > 0) {
    const equityLikeRatio = (totalRegistered + totalNonReg) / totalAssets;
    if (latestRisk.riskTolerance === "low" && equityLikeRatio > 0.5) {
      alerts.push(mkInsight(orgId, clientId, "risk_mismatch", "critical",
        "Portfolio risk exceeds client tolerance",
        `Client risk profile is "low" but ${Math.round(equityLikeRatio * 100)}% of assets are in market-linked accounts.`,
        { riskTolerance: "low", equityLikeRatio: Math.round(equityLikeRatio * 100) }));
    }
    if (latestRisk.riskTolerance === "high" && equityLikeRatio < 0.3) {
      alerts.push(mkInsight(orgId, clientId, "risk_mismatch", "info",
        "Portfolio may be too conservative for client profile",
        `Client risk profile is "high" but only ${Math.round(equityLikeRatio * 100)}% of assets are in market-linked accounts.`,
        { riskTolerance: "high", equityLikeRatio: Math.round(equityLikeRatio * 100) }));
    }
  }

  // Liquidity warning: emergency fund < 3 months
  if (monthlyExpenses > 0) {
    const liquidMonths = cashAssets / monthlyExpenses;
    if (liquidMonths < 3) {
      alerts.push(mkInsight(orgId, clientId, "liquidity_warning", "warning",
        "Insufficient emergency fund",
        `Cash reserves cover only ${liquidMonths.toFixed(1)} months of expenses (recommended: 3-6 months).`,
        { liquidMonths: Math.round(liquidMonths * 10) / 10 }));
    }
  }

  // Conflict of interest: check if advisor has undisclosed conflicts
  const disclosedConflicts = db.data.conflictDisclosures.filter(
    (d) => d.organizationId === orgId && (d.clientId === clientId || !d.clientId),
  );
  if (disclosedConflicts.length === 0 && client?.kycCompleted) {
    alerts.push(mkInsight(orgId, clientId, "conflict_of_interest", "info",
      "No conflict disclosures on file",
      "Regulatory best practice requires periodic conflict-of-interest disclosure. Consider filing one.",
      {}));
  }

  return alerts;
}

function mkInsight(
  orgId: string, clientId: string, category: InsightCategory, severity: InsightSeverity,
  title: string, description: string, dataPoints: Record<string, number | string>,
): Omit<InsightAlert, "id" | "createdAt"> {
  return {
    organizationId: orgId,
    clientId,
    category,
    severity,
    title,
    description,
    dataPoints,
    advisorApprovedForClient: false,
  };
}

export function insightsRouter(): Router {
  const router = Router();
  router.use(requireAuth);
  router.use(requirePermission("insights.read"));

  router.get("/:clientId", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === req.auth?.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    const computed = computeClientInsights(client.id, req.auth.organizationId);
    const persisted = db.data.insightAlerts.filter(
      (a) => a.clientId === client.id && a.organizationId === req.auth?.organizationId,
    );
    res.json({
      clientId: client.id,
      computed,
      persisted,
      disclaimer: "Insights are internal-only advisory signals. Not client-facing unless advisor-approved.",
    });
  });

  router.post("/:clientId/generate", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const client = db.data.clients.find(
      (c) => c.id === req.params.clientId && c.organizationId === req.auth?.organizationId,
    );
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    const computed = computeClientInsights(client.id, req.auth.organizationId);
    const now = new Date().toISOString();
    const persisted: InsightAlert[] = computed.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      createdAt: now,
    }));

    db.data.insightAlerts = db.data.insightAlerts.filter(
      (a) => !(a.clientId === client.id && a.organizationId === req.auth?.organizationId && !a.resolvedAt),
    );
    db.data.insightAlerts.push(...persisted);

    appendAuditEvent(db.data, req.auth, {
      eventType: "insights.generated",
      entityType: "insight_alert",
      entityId: client.id,
      metadata: { count: persisted.length },
    });
    await persist();
    res.json({ generated: persisted.length, alerts: persisted });
  });

  router.post("/:alertId/approve-for-client", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const alert = db.data.insightAlerts.find(
      (a) => a.id === req.params.alertId && a.organizationId === req.auth?.organizationId,
    );
    if (!alert) {
      res.status(404).json({ error: "Insight alert not found." });
      return;
    }
    alert.advisorApprovedForClient = true;
    appendAuditEvent(db.data, req.auth, {
      eventType: "insights.approved_for_client",
      entityType: "insight_alert",
      entityId: alert.id,
    });
    await persist();
    res.json(alert);
  });

  router.post("/:alertId/resolve", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const alert = db.data.insightAlerts.find(
      (a) => a.id === req.params.alertId && a.organizationId === req.auth?.organizationId,
    );
    if (!alert) {
      res.status(404).json({ error: "Insight alert not found." });
      return;
    }
    alert.resolvedAt = new Date().toISOString();
    appendAuditEvent(db.data, req.auth, {
      eventType: "insights.resolved",
      entityType: "insight_alert",
      entityId: alert.id,
    });
    await persist();
    res.json(alert);
  });

  return router;
}
