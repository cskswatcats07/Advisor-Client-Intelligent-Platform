import { Router } from "express";
import { z } from "zod";
import { db, persist } from "../../db/store";
import { parseBody } from "../../lib/http";
import { requireAuth, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";

const loginSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email(),
});

export function authRouter(): Router {
  const router = Router();

  router.get("/bootstrap", async (_req, res) => {
    await db.read();
    res.json({
      organizations: db.data.organizations,
      users: db.data.users,
      hint: "Use x-org-id and x-user-id headers for authenticated calls.",
    });
  });

  router.post("/login", async (req, res) => {
    await db.read();
    const payload = parseBody(loginSchema, req, res);
    if (!payload) return;

    const user = db.data.users.find(
      (u) =>
        u.organizationId === payload.organizationId &&
        u.email.toLowerCase() === payload.email.toLowerCase() &&
        u.active,
    );
    if (!user) {
      res.status(404).json({ error: "No active user matched that email in organization." });
      return;
    }

    appendAuditEvent(
      db.data,
      { organizationId: payload.organizationId, userId: user.id, role: user.role },
      {
        eventType: "auth.login",
        entityType: "user",
        entityId: user.id,
        metadata: { email: user.email },
      },
    );
    await persist();
    res.json({
      user,
      authHeaders: {
        "x-org-id": payload.organizationId,
        "x-user-id": user.id,
      },
    });
  });

  router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
    res.json({
      auth: req.auth,
      user: req.authUser,
    });
  });

  return router;
}
