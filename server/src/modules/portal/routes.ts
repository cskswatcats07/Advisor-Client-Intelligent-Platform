import { Router } from "express";
import { db, persist } from "../../db/store";
import { portalSessionSchema } from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

export function portalRouter(): Router {
  const router = Router();

  router.post(
    "/sessions",
    requireAuth,
    requireRoles(["owner", "advisor", "associate", "compliance"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(portalSessionSchema, req, res);
      if (!payload) return;
      const client = db.data.clients.find(
        (c) =>
          c.id === payload.clientId && c.organizationId === req.auth?.organizationId,
      );
      if (!client) {
        res.status(404).json({ error: "Client not found." });
        return;
      }

      const token = crypto.randomUUID().replaceAll("-", "");
      const expiresInHours = payload.expiresInHours ?? 72;
      const expiresAt = new Date(
        Date.now() + expiresInHours * 60 * 60 * 1000,
      ).toISOString();

      const session = {
        token,
        organizationId: req.auth.organizationId,
        clientId: payload.clientId,
        expiresAt,
        createdByUserId: req.auth.userId,
      };
      db.data.portalSessions.push(session);
      appendAuditEvent(db.data, req.auth, {
        eventType: "portal.session_created",
        entityType: "portal_session",
        entityId: token,
        after: { ...session, tokenPreview: `${token.slice(0, 8)}...` },
      });
      await persist();
      res.status(201).json({
        token,
        portalUrl: `/api/portal/view/${token}`,
        expiresAt,
      });
    },
  );

  router.get("/view/:token", async (req, res) => {
    await db.read();
    const session = db.data.portalSessions.find((s) => s.token === req.params.token);
    if (!session) {
      res.status(404).json({ error: "Portal session not found." });
      return;
    }
    if (session.expiresAt < new Date().toISOString()) {
      res.status(410).json({ error: "Portal session expired." });
      return;
    }
    const client = db.data.clients.find((c) => c.id === session.clientId);
    if (!client) {
      res.status(404).json({ error: "Client missing." });
      return;
    }
    const plans = db.data.plans.filter(
      (p) => p.organizationId === session.organizationId && p.householdId === client.householdId,
    );
    const latestPlan = plans.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    const latestVersion = latestPlan
      ? db.data.planVersions
          .filter((v) => v.planId === latestPlan.id)
          .sort((a, b) => b.versionNumber - a.versionNumber)[0]
      : undefined;
    res.json({
      disclaimer:
        "Client portal output is illustrative and educational only, not professional financial, tax, or legal advice.",
      client: {
        id: client.id,
        fullNameMasked: client.fullNameMasked,
      },
      latestPlan: latestPlan
        ? {
            id: latestPlan.id,
            title: latestPlan.title,
            status: latestPlan.status,
            updatedAt: latestPlan.updatedAt,
          }
        : null,
      latestVersion: latestVersion
        ? {
            versionNumber: latestVersion.versionNumber,
            assumptionsSummary: latestVersion.assumptionsSummary,
            projections: latestVersion.projections,
            createdAt: latestVersion.createdAt,
          }
        : null,
      disclosures: db.data.disclosureAcceptances.filter(
        (d) => d.clientId === client.id && d.organizationId === session.organizationId,
      ),
    });
  });

  return router;
}
