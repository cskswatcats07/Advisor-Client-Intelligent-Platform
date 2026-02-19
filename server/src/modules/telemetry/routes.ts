import { Router } from "express";
import { db, persist } from "../../db/store";
import { browserLogSchema } from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, type AuthedRequest } from "../../middleware/auth";
import { loggedFetch } from "../../lib/networkClient";
import { maskObject } from "../../security/masking";

export function telemetryRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/logs", async (req: AuthedRequest, res) => {
    await db.read();
    const orgId = req.auth?.organizationId;
    const direction = req.query.direction as string | undefined;
    const rows = db.data.apiLogs
      .filter((l) => l.organizationId === orgId)
      .filter((l) => (direction ? l.direction === direction : true))
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 500);
    res.json(rows);
  });

  router.post("/browser-call", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(browserLogSchema, req, res);
    if (!payload) return;
    db.data.apiLogs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      direction: "browser",
      protocol: payload.protocol ?? "peer",
      method: payload.method ?? "BROWSER",
      route: payload.route,
      statusCode: payload.statusCode,
      durationMs: payload.durationMs,
      organizationId: req.auth.organizationId,
      actorUserIdHash: undefined,
      piiMaskApplied: true,
      maskedRequest: maskObject(payload.details ?? {}) as Record<string, unknown>,
    });
    await persist();
    res.status(201).json({ ok: true });
  });

  router.post("/outbound-probe", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const targetUrl = (req.body as { url?: string })?.url ?? "https://example.com";
    const response = await loggedFetch(targetUrl, { method: "GET" }, {
      organizationId: req.auth.organizationId,
      actorUserId: req.auth.userId,
    });
    res.json({
      ok: response.ok,
      status: response.status,
      targetUrl,
      note: "Outbound call was logged in telemetry apiLogs.",
    });
  });

  return router;
}
