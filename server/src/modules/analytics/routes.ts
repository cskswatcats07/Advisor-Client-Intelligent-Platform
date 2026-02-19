import { Router } from "express";
import { db, persist } from "../../db/store";
import { analyticsConfigSchema } from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";
import { requireControlApproval } from "../controls/service";

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function latestNetWorthForVersion(version: {
  projections: Array<{ netWorth: number }>;
}): number {
  const last = version.projections[version.projections.length - 1];
  return last?.netWorth ?? 0;
}

export function analyticsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/dashboard", async (req: AuthedRequest, res) => {
    await db.read();
    const orgId = req.auth?.organizationId;
    const clients = db.data.clients.filter((c) => c.organizationId === orgId);
    const versions = db.data.planVersions.filter((v) => v.organizationId === orgId);
    const avgFinalNetWorth = avg(versions.map(latestNetWorthForVersion));
    const statusCounts = db.data.plans
      .filter((p) => p.organizationId === orgId)
      .reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
      }, {});

    const netWorthSeries = versions.slice(0, 25).map((v) => ({
      versionId: v.id,
      planId: v.planId,
      finalNetWorth: latestNetWorthForVersion(v),
      createdAt: v.createdAt,
    }));

    const activeInsights = db.data.insightAlerts.filter(
      (a) => a.organizationId === orgId && !a.resolvedAt,
    );
    const insightsBySeverity = activeInsights.reduce<Record<string, number>>((acc, a) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1;
      return acc;
    }, {});

    res.json({
      generatedAt: new Date().toISOString(),
      kpis: {
        clientCount: clients.length,
        planCount: db.data.plans.filter((p) => p.organizationId === orgId).length,
        avgFinalNetWorth,
        pendingControls: db.data.controlTickets.filter(
          (t) => t.organizationId === orgId && t.status === "pending",
        ).length,
        activeInsights: activeInsights.length,
        conflictDisclosures: db.data.conflictDisclosures.filter(
          (d) => d.organizationId === orgId,
        ).length,
      },
      charts: {
        planStatusBreakdown: statusCounts,
        netWorthSeries,
        insightsBySeverity,
      },
    });
  });

  router.get("/config", async (req: AuthedRequest, res) => {
    await db.read();
    const config = db.data.analyticsConfigs.find(
      (c) => c.organizationId === req.auth?.organizationId,
    );
    res.json(config ?? null);
  });

  router.put(
    "/config",
    requireRoles(["owner", "compliance"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(analyticsConfigSchema, req, res);
      if (!payload) return;
      const control = requireControlApproval(
        req.auth,
        "analytics.config.update",
        "organization",
        req.auth.organizationId,
        req.header("x-control-ticket-id") ?? undefined,
      );
      if (!control.allowed) {
        res.status(428).json({
          error: control.message,
          requiredApprovals: control.requiredApprovals,
        });
        return;
      }
      let config = db.data.analyticsConfigs.find(
        (c) => c.organizationId === req.auth?.organizationId,
      );
      if (!config) {
        config = {
          id: crypto.randomUUID(),
          organizationId: req.auth.organizationId,
          metricDefinitions: payload.metricDefinitions,
          insightRules: payload.insightRules,
        };
        db.data.analyticsConfigs.push(config);
      } else {
        config.metricDefinitions = payload.metricDefinitions;
        config.insightRules = payload.insightRules;
      }
      appendAuditEvent(db.data, req.auth, {
        eventType: "analytics.config.updated",
        entityType: "analytics_config",
        entityId: config.id,
        after: config,
      });
      await persist();
      res.json(config);
    },
  );

  return router;
}
