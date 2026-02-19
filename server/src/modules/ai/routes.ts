import { Router } from "express";
import { db, persist } from "../../db/store";
import { aiAttestationSchema, aiDraftSchema, aiEditSchema } from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requirePermission, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

const HALLUCINATION_DISCLAIMER =
  "DISCLAIMER: This content is AI-generated and may contain errors, omissions, or hallucinations. " +
  "It is provided as a starting point for advisor review only. The advisor must independently verify all facts, " +
  "edit the content, and provide attestation before any client-facing use. This output does NOT constitute " +
  "financial advice and must not be published to clients without advisor review and approval.";

function generateDraft(
  draftType: "meeting_summary" | "scenario_explanation" | "compliance_check",
  prompt: string,
): string {
  const intro =
    "Draft generated for advisor review only. This content is not final, not client-approved, " +
    "and not personalized advice until advisor attestation.";
  if (draftType === "meeting_summary") {
    return `${intro}\n\n${HALLUCINATION_DISCLAIMER}\n\nMeeting summary draft:\n- Discussed goals and retirement timing.\n- Reviewed account mix and inflation assumptions.\n- Identified follow-up actions for contribution room and cash-flow.\n\nSource prompt:\n${prompt}`;
  }
  if (draftType === "scenario_explanation") {
    return `${intro}\n\n${HALLUCINATION_DISCLAIMER}\n\nScenario explanation draft:\nThis scenario changes one or more assumptions and compares projected balances and net worth over time. Use this narrative as a starting point, then tailor with advisor rationale.\n\nSource prompt:\n${prompt}`;
  }
  return `${intro}\n\n${HALLUCINATION_DISCLAIMER}\n\nCompliance checklist draft:\n- Confirm disclosures shown and accepted.\n- Confirm recommendation rationale entered.\n- Confirm client-visible output is version-stamped.\n\nSource prompt:\n${prompt}`;
}

function retentionExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 7);
  return d.toISOString();
}

export function aiRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/drafts", async (req: AuthedRequest, res) => {
    await db.read();
    const drafts = db.data.aiDrafts.filter(
      (d) => d.organizationId === req.auth?.organizationId,
    );
    res.json(drafts);
  });

  router.post("/drafts", requirePermission("ai.generate"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(aiDraftSchema, req, res);
    if (!payload) return;

    const output = generateDraft(payload.draftType, payload.prompt);
    const draft = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      clientId: payload.clientId,
      planId: payload.planId,
      prompt: payload.prompt,
      output,
      draftType: payload.draftType,
      hallucinationDisclaimer: true,
      advisorEdited: false,
      publishedToClient: false,
      createdByUserId: req.auth.userId,
      createdAt: new Date().toISOString(),
      retentionExpiresAt: retentionExpiry(),
    };
    db.data.aiDrafts.push(draft);
    appendAuditEvent(db.data, req.auth, {
      eventType: "ai.draft_created",
      entityType: "ai_draft",
      entityId: draft.id,
      after: {
        draftId: draft.id,
        prompt: payload.prompt,
        output,
        draftType: payload.draftType,
        hallucinationDisclaimer: true,
      },
    });
    await persist();
    res.status(201).json(draft);
  });

  router.post("/edit", requirePermission("ai.attest"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(aiEditSchema, req, res);
    if (!payload) return;
    const draft = db.data.aiDrafts.find(
      (d) => d.id === payload.draftId && d.organizationId === req.auth?.organizationId,
    );
    if (!draft) {
      res.status(404).json({ error: "Draft not found." });
      return;
    }
    const before = { output: draft.output, advisorEdited: draft.advisorEdited };
    draft.output = payload.editedOutput;
    draft.advisorEdited = true;
    appendAuditEvent(db.data, req.auth, {
      eventType: "ai.draft_edited",
      entityType: "ai_draft",
      entityId: draft.id,
      before,
      after: { output: draft.output, advisorEdited: true },
    });
    await persist();
    res.json(draft);
  });

  router.post("/attest", requirePermission("ai.attest"), async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(aiAttestationSchema, req, res);
    if (!payload) return;
    if (payload.attestedByUserId !== req.auth.userId) {
      res.status(400).json({ error: "attestedByUserId must match authenticated user." });
      return;
    }
    const draft = db.data.aiDrafts.find(
      (d) => d.id === payload.draftId && d.organizationId === req.auth?.organizationId,
    );
    if (!draft) {
      res.status(404).json({ error: "Draft not found." });
      return;
    }
    if (!draft.advisorEdited) {
      res.status(400).json({
        error: "Advisor must edit the draft before attestation. No direct publishing of AI output is permitted.",
      });
      return;
    }
    draft.attestedByUserId = req.auth.userId;
    draft.attestedAt = new Date().toISOString();
    appendAuditEvent(db.data, req.auth, {
      eventType: "ai.draft_attested",
      entityType: "ai_draft",
      entityId: draft.id,
      after: draft,
    });
    await persist();
    res.json(draft);
  });

  return router;
}
