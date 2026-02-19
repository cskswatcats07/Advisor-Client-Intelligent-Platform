import { Router } from "express";
import { db, persist } from "../../db/store";
import {
  approvalDecisionSchema,
  approvalSubmitSchema,
  disclosureAcceptanceSchema,
  recommendationSchema,
} from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requirePermission, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

export function complianceRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/audit", requirePermission("audit.read"), async (req: AuthedRequest, res) => {
    await db.read();
    const audit = db.data.auditEvents
      .filter((e) => e.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json(audit);
  });

  router.get("/approvals", async (req: AuthedRequest, res) => {
    await db.read();
    const approvals = db.data.planApprovals.filter(
      (a) => a.organizationId === req.auth?.organizationId,
    );
    res.json(approvals);
  });

  router.post("/approvals/submit", requirePermission("plan.create"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(approvalSubmitSchema, req, res);
    if (!payload) return;
    const plan = db.data.plans.find(
      (p) => p.id === payload.planId && p.organizationId === req.auth?.organizationId,
    );
    if (!plan) {
      res.status(404).json({ error: "Plan not found." });
      return;
    }
    const approval = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      planId: payload.planId,
      submittedByUserId: req.auth.userId,
      submittedAt: new Date().toISOString(),
      status: "submitted" as const,
      notes: payload.notes,
    };
    db.data.planApprovals.push(approval);
    appendAuditEvent(db.data, req.auth, {
      eventType: "approval.submitted",
      entityType: "plan_approval",
      entityId: approval.id,
      after: approval,
    });
    await persist();
    res.status(201).json(approval);
  });

  router.post("/approvals/decision", requirePermission("compliance.approve"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(approvalDecisionSchema, req, res);
    if (!payload) return;
    const approval = db.data.planApprovals.find(
      (a) => a.id === payload.approvalId && a.organizationId === req.auth?.organizationId,
    );
    if (!approval) {
      res.status(404).json({ error: "Approval request not found." });
      return;
    }
    const before = { ...approval };
    approval.status = payload.status;
    approval.approvedByUserId = req.auth.userId;
    approval.approvedAt = new Date().toISOString();
    approval.notes = payload.notes ?? approval.notes;

    appendAuditEvent(db.data, req.auth, {
      eventType: "approval.decided",
      entityType: "plan_approval",
      entityId: approval.id,
      before,
      after: approval,
    });
    await persist();
    res.json(approval);
  });

  router.get("/recommendations", async (req: AuthedRequest, res) => {
    await db.read();
    const notes = db.data.recommendationNotes.filter(
      (r) => r.organizationId === req.auth?.organizationId,
    );
    res.json(notes);
  });

  router.post("/recommendations", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(recommendationSchema, req, res);
    if (!payload) return;

    if (!payload.advisorAttested) {
      res.status(400).json({
        error: "Advisor attestation is required before storing recommendations.",
      });
      return;
    }

    // Capture suitability snapshot at recommendation time (PRD §4.6)
    const latestRisk = db.data.riskProfileSnapshots
      .filter((r) => r.clientId === payload.clientId && r.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1))[0];
    const latestKyc = db.data.kycSnapshots
      .filter((k) => k.clientId === payload.clientId && k.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))[0];
    const latestNw = db.data.netWorthRecords
      .filter((n) => n.clientId === payload.clientId && n.organizationId === req.auth?.organizationId)
      .sort((a, b) => (a.computedAt < b.computedAt ? 1 : -1))[0];

    const note = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      planId: payload.planId,
      clientId: payload.clientId,
      recommendationText: payload.recommendationText,
      rationale: payload.rationale,
      advisorAttested: payload.advisorAttested,
      suitabilitySnapshot: {
        riskProfile: latestRisk?.riskTolerance ?? "unknown",
        investmentHorizon: latestRisk?.investmentHorizon ?? "unknown",
        netWorth: latestNw?.netWorth ?? 0,
        kycVersion: latestKyc?.versionNumber ?? 0,
      },
      createdByUserId: req.auth.userId,
      createdAt: new Date().toISOString(),
    };
    db.data.recommendationNotes.push(note);
    appendAuditEvent(db.data, req.auth, {
      eventType: "recommendation.created",
      entityType: "recommendation_note",
      entityId: note.id,
      after: note,
    });
    await persist();
    res.status(201).json(note);
  });

  router.post("/disclosures/accept", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(disclosureAcceptanceSchema, req, res);
    if (!payload) return;
    const acceptance = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      clientId: payload.clientId,
      planVersionId: payload.planVersionId,
      disclosureType: payload.disclosureType,
      acceptedAt: new Date().toISOString(),
      acceptedByName: payload.acceptedByName,
    };
    db.data.disclosureAcceptances.push(acceptance);
    appendAuditEvent(db.data, req.auth, {
      eventType: "disclosure.accepted",
      entityType: "disclosure_acceptance",
      entityId: acceptance.id,
      after: acceptance,
    });
    await persist();
    res.status(201).json(acceptance);
  });

  router.get("/disclosures", async (req: AuthedRequest, res) => {
    await db.read();
    const rows = db.data.disclosureAcceptances.filter(
      (d) => d.organizationId === req.auth?.organizationId,
    );
    res.json(rows);
  });

  return router;
}
