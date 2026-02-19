import { Router } from "express";
import { db, persist } from "../../db/store";
import { requireAuth, requirePermission, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

export function retentionRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/policies", requirePermission("audit.read"), async (req: AuthedRequest, res) => {
    await db.read();
    const policies = db.data.dataRetentionPolicies.filter(
      (p) => p.organizationId === req.auth?.organizationId,
    );
    res.json(policies);
  });

  router.post(
    "/enforce",
    requireRoles(["owner", "system_admin"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const orgId = req.auth.organizationId;
      const now = new Date();
      let purgedCount = 0;

      for (const policy of db.data.dataRetentionPolicies.filter((p) => p.organizationId === orgId)) {
        if (policy.permanent) continue;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - policy.retentionYears);
        const cutoffIso = cutoff.toISOString();

        if (policy.dataType === "audit_logs") {
          const before = db.data.auditEvents.length;
          db.data.auditEvents = db.data.auditEvents.filter(
            (e) => e.organizationId !== orgId || e.createdAt >= cutoffIso,
          );
          purgedCount += before - db.data.auditEvents.length;
        }

        if (policy.dataType === "ai_drafts") {
          const before = db.data.aiDrafts.length;
          db.data.aiDrafts = db.data.aiDrafts.filter(
            (d) => d.organizationId !== orgId || d.createdAt >= cutoffIso,
          );
          purgedCount += before - db.data.aiDrafts.length;
        }

        if (policy.dataType === "client_pii") {
          const before = db.data.piiVault.length;
          db.data.piiVault = db.data.piiVault.filter(
            (p) => p.organizationId !== orgId || p.createdAt >= cutoffIso,
          );
          purgedCount += before - db.data.piiVault.length;
        }

        policy.lastEnforcedAt = now.toISOString();
      }

      appendAuditEvent(db.data, req.auth, {
        eventType: "retention.enforced",
        entityType: "data_retention_policy",
        entityId: orgId,
        metadata: { purgedCount },
      });
      await persist();
      res.json({ enforcedAt: now.toISOString(), purgedCount });
    },
  );

  return router;
}
