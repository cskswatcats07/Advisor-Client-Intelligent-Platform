import { Router } from "express";
import { db, persist } from "../../db/store";
import { advisorAttestationSchema, conflictDisclosureSchema } from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requirePermission, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

export function ethicsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  /* ─── Conflict Disclosures (PRD §10) ─── */

  router.get("/conflicts", async (req: AuthedRequest, res) => {
    await db.read();
    const rows = db.data.conflictDisclosures.filter(
      (d) => d.organizationId === req.auth?.organizationId,
    );
    res.json(rows);
  });

  router.post("/conflicts", requirePermission("client.write"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(conflictDisclosureSchema, req, res);
    if (!payload) return;

    const disclosure = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      advisorUserId: req.auth.userId,
      clientId: payload.clientId,
      conflictType: payload.conflictType,
      description: payload.description,
      mitigationStrategy: payload.mitigationStrategy,
      disclosedAt: new Date().toISOString(),
    };
    db.data.conflictDisclosures.push(disclosure);
    appendAuditEvent(db.data, req.auth, {
      eventType: "ethics.conflict_disclosed",
      entityType: "conflict_disclosure",
      entityId: disclosure.id,
      after: disclosure,
    });
    await persist();
    res.status(201).json(disclosure);
  });

  /* ─── Advisor Attestations (PRD §10) ─── */

  router.get("/attestations", async (req: AuthedRequest, res) => {
    await db.read();
    const rows = db.data.advisorAttestations.filter(
      (a) => a.organizationId === req.auth?.organizationId,
    );
    res.json(rows);
  });

  router.post("/attestations", requirePermission("ai.attest"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(advisorAttestationSchema, req, res);
    if (!payload) return;

    const attestation = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      advisorUserId: req.auth.userId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      attestationText: payload.attestationText,
      attestedAt: new Date().toISOString(),
    };
    db.data.advisorAttestations.push(attestation);
    appendAuditEvent(db.data, req.auth, {
      eventType: "ethics.attestation_created",
      entityType: "advisor_attestation",
      entityId: attestation.id,
      after: attestation,
    });
    await persist();
    res.status(201).json(attestation);
  });

  /* ─── Client Transparency Dashboard data ─── */

  router.get("/transparency/:clientId", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const clientId = req.params.clientId;
    const orgId = req.auth.organizationId;

    const conflicts = db.data.conflictDisclosures.filter(
      (d) => d.organizationId === orgId && (d.clientId === clientId || !d.clientId),
    );
    const attestations = db.data.advisorAttestations.filter(
      (a) => a.organizationId === orgId,
    );
    const consents = db.data.fdxConsents.filter(
      (c) => c.organizationId === orgId && c.clientId === clientId,
    );
    const disclosures = db.data.disclosureAcceptances.filter(
      (d) => d.organizationId === orgId && d.clientId === clientId,
    );

    res.json({
      clientId,
      conflictDisclosures: conflicts,
      advisorAttestations: attestations.length,
      activeConsents: consents.filter((c) => c.status === "ACTIVE").length,
      revokedConsents: consents.filter((c) => c.status === "REVOKED").length,
      disclosureAcceptances: disclosures.length,
      disclaimer: "This transparency view summarizes advisor disclosures and client consent status.",
    });
  });

  return router;
}
