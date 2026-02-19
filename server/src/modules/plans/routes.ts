import { Router } from "express";
import { db, persist } from "../../db/store";
import { planInputEnvelopeSchema, planStatusSchema, scenarioSchema } from "../../domain/schema";
import type { PlanInputs } from "../../domain/types";
import { parseBody } from "../../lib/http";
import { requireAuth, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";
import { createPlanVersion, createPlanWithInitialVersion, createScenario } from "./service";

export function plansRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req: AuthedRequest, res) => {
    await db.read();
    const plans = db.data.plans.filter((p) => p.organizationId === req.auth?.organizationId);
    res.json(plans);
  });

  router.get("/:planId/versions", async (req: AuthedRequest, res) => {
    await db.read();
    const versions = db.data.planVersions
      .filter(
        (v) => v.organizationId === req.auth?.organizationId && v.planId === req.params.planId,
      )
      .sort((a, b) => b.versionNumber - a.versionNumber);
    res.json(versions);
  });

  router.post("/", requireRoles(["owner", "advisor", "associate"]), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(planInputEnvelopeSchema, req, res);
    if (!payload) return;

    const household = db.data.households.find(
      (h) => h.id === payload.householdId && h.organizationId === req.auth?.organizationId,
    );
    if (!household) {
      res.status(404).json({ error: "Household not found in your organization." });
      return;
    }

    const { plan, version } = createPlanWithInitialVersion(db.data, req.auth, {
      title: payload.title,
      householdId: payload.householdId,
      assumptionsSummary: payload.assumptionsSummary,
      inputs: payload.inputs as PlanInputs,
    });
    appendAuditEvent(db.data, req.auth, {
      eventType: "plan.created",
      entityType: "plan",
      entityId: plan.id,
      after: { plan, version },
    });
    await persist();
    res.status(201).json({ plan, version });
  });

  router.post("/:planId/versions", requireRoles(["owner", "advisor", "associate"]), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const auth = req.auth;
    const payload = parseBody(planInputEnvelopeSchema, req, res);
    if (!payload) return;

    const plan = db.data.plans.find(
      (p) => p.id === req.params.planId && p.organizationId === auth.organizationId,
    );
    if (!plan) {
      res.status(404).json({ error: "Plan not found." });
      return;
    }

    const version = createPlanVersion(db.data, auth, plan, {
      assumptionsSummary: payload.assumptionsSummary,
      inputs: payload.inputs as PlanInputs,
    });
    appendAuditEvent(db.data, auth, {
      eventType: "plan.version_created",
      entityType: "plan_version",
      entityId: version.id,
      after: version,
    });
    await persist();
    res.status(201).json(version);
  });

  router.post("/:planId/status", requireRoles(["owner", "advisor", "compliance"]), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const parsed = planStatusSchema.safeParse(req.body?.status);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }
    const plan = db.data.plans.find(
      (p) => p.id === req.params.planId && p.organizationId === req.auth?.organizationId,
    );
    if (!plan) {
      res.status(404).json({ error: "Plan not found." });
      return;
    }
    const before = { ...plan };
    plan.status = parsed.data;
    plan.updatedAt = new Date().toISOString();
    appendAuditEvent(db.data, req.auth, {
      eventType: "plan.status_changed",
      entityType: "plan",
      entityId: plan.id,
      before,
      after: plan,
    });
    await persist();
    res.json(plan);
  });

  router.post("/scenarios", requireRoles(["owner", "advisor", "associate"]), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(scenarioSchema, req, res);
    if (!payload) return;
    const version = db.data.planVersions.find(
      (v) =>
        v.id === payload.planVersionId && v.organizationId === req.auth?.organizationId,
    );
    if (!version) {
      res.status(404).json({ error: "Plan version not found." });
      return;
    }

    const scenario = createScenario(db.data, req.auth, {
      planVersionId: payload.planVersionId,
      name: payload.name,
      notes: payload.notes,
      inputs: payload.inputs as PlanInputs,
    });
    appendAuditEvent(db.data, req.auth, {
      eventType: "scenario.created",
      entityType: "scenario",
      entityId: scenario.id,
      after: scenario,
    });
    await persist();
    res.status(201).json(scenario);
  });

  router.get("/:planId/scenarios", async (req: AuthedRequest, res) => {
    await db.read();
    const versionIds = db.data.planVersions
      .filter((v) => v.planId === req.params.planId && v.organizationId === req.auth?.organizationId)
      .map((v) => v.id);
    const scenarios = db.data.scenarios.filter((s) => versionIds.includes(s.planVersionId));
    res.json(scenarios);
  });

  return router;
}
