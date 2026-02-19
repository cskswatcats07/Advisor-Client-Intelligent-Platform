import { Router } from "express";
import { db, persist } from "../../db/store";
import {
  notificationRuleSchema,
  notificationTemplateSchema,
  twoFactorStartSchema,
  twoFactorVerifySchema,
} from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { hashSensitive } from "../../security/crypto";
import { appendAuditEvent } from "../audit/service";
import { requireControlApproval } from "../controls/service";

function renderTemplate(
  template: { body: string; subject?: string },
  payload: Record<string, string | number | boolean>,
): { body: string; subject?: string } {
  const apply = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
      payload[key] != null ? String(payload[key]) : "",
    );
  return {
    body: apply(template.body),
    subject: template.subject ? apply(template.subject) : undefined,
  };
}

function issueOtp(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export function notificationsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/templates", async (req: AuthedRequest, res) => {
    await db.read();
    res.json(
      db.data.notificationTemplates.filter(
        (t) => t.organizationId === req.auth?.organizationId,
      ),
    );
  });

  router.post(
    "/templates",
    requireRoles(["owner", "advisor", "compliance"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(notificationTemplateSchema, req, res);
      if (!payload) return;
      const row = {
        id: crypto.randomUUID(),
        organizationId: req.auth.organizationId,
        name: payload.name,
        channel: payload.channel,
        subject: payload.subject,
        body: payload.body,
        active: payload.active ?? true,
      };
      db.data.notificationTemplates.push(row);
      appendAuditEvent(db.data, req.auth, {
        eventType: "notification.template.created",
        entityType: "notification_template",
        entityId: row.id,
        after: row,
      });
      await persist();
      res.status(201).json(row);
    },
  );

  router.get("/rules", async (req: AuthedRequest, res) => {
    await db.read();
    res.json(
      db.data.notificationRules.filter(
        (r) => r.organizationId === req.auth?.organizationId,
      ),
    );
  });

  router.post(
    "/rules",
    requireRoles(["owner", "advisor", "compliance"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(notificationRuleSchema, req, res);
      if (!payload) return;
      const control = requireControlApproval(
        req.auth,
        "notification.rule.update",
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
      const template = db.data.notificationTemplates.find(
        (t) =>
          t.id === payload.templateId &&
          t.organizationId === req.auth?.organizationId &&
          t.active,
      );
      if (!template) {
        res.status(404).json({ error: "Active template not found." });
        return;
      }
      const row = {
        id: crypto.randomUUID(),
        organizationId: req.auth.organizationId,
        name: payload.name,
        triggerType: payload.triggerType,
        templateId: payload.templateId,
        conditionExpr: payload.conditionExpr,
        enabled: payload.enabled ?? true,
        throttleMinutes: payload.throttleMinutes,
      };
      db.data.notificationRules.push(row);
      appendAuditEvent(db.data, req.auth, {
        eventType: "notification.rule.created",
        entityType: "notification_rule",
        entityId: row.id,
        after: row,
      });
      await persist();
      res.status(201).json(row);
    },
  );

  router.post("/emit", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const auth = req.auth;
    const payload = (req.body ?? {}) as {
      ruleId: string;
      recipientRef: string;
      payload?: Record<string, string | number | boolean>;
    };
    const rule = db.data.notificationRules.find(
      (r) =>
        r.id === payload.ruleId &&
        r.organizationId === auth.organizationId &&
        r.enabled,
    );
    if (!rule) {
      res.status(404).json({ error: "Enabled notification rule not found." });
      return;
    }
    const template = db.data.notificationTemplates.find(
      (t) =>
        t.id === rule.templateId &&
        t.organizationId === auth.organizationId &&
        t.active,
    );
    if (!template) {
      res.status(404).json({ error: "Active template not found for rule." });
      return;
    }
    const rendered = renderTemplate(template, payload.payload ?? {});
    const event = {
      id: crypto.randomUUID(),
      organizationId: auth.organizationId,
      ruleId: rule.id,
      recipientRef: payload.recipientRef,
      payload: payload.payload ?? {},
      status: "sent" as const,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };
    db.data.notificationEvents.push(event);
    appendAuditEvent(db.data, auth, {
      eventType: "notification.sent",
      entityType: "notification_event",
      entityId: event.id,
      metadata: {
        channel: template.channel,
        recipientRefHash: hashSensitive(payload.recipientRef),
      },
      after: {
        id: event.id,
        channel: template.channel,
        renderedSubject: rendered.subject,
        renderedBody: rendered.body,
      },
    });
    await persist();
    res.status(201).json({
      event,
      rendered,
      providerStatus: "mock-delivered",
    });
  });

  router.post("/2fa/start", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(twoFactorStartSchema, req, res);
    if (!payload) return;
    const user = db.data.users.find(
      (u) => u.id === payload.userId && u.organizationId === req.auth?.organizationId,
    );
    if (!user) {
      res.status(404).json({ error: "User not found for 2FA challenge." });
      return;
    }

    const otp = issueOtp();
    const challenge = {
      id: crypto.randomUUID(),
      organizationId: req.auth.organizationId,
      userId: payload.userId,
      purpose: payload.purpose,
      otpHash: hashSensitive(`${payload.userId}:${otp}`),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
    };
    db.data.twoFactorChallenges.push(challenge);
    await persist();

    // In production, OTP should only be sent via secure out-of-band delivery.
    res.status(201).json({
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt,
      delivery: "mock",
      otpPreviewForDevOnly: otp,
    });
  });

  router.post("/2fa/verify", async (req: AuthedRequest, res) => {
    await db.read();
    if (!req.auth) return;
    const payload = parseBody(twoFactorVerifySchema, req, res);
    if (!payload) return;
    const challenge = db.data.twoFactorChallenges.find(
      (c) =>
        c.id === payload.challengeId &&
        c.userId === payload.userId &&
        c.organizationId === req.auth?.organizationId,
    );
    if (!challenge) {
      res.status(404).json({ error: "2FA challenge not found." });
      return;
    }
    if (challenge.verifiedAt) {
      res.status(409).json({ error: "2FA challenge already verified." });
      return;
    }
    if (new Date(challenge.expiresAt) <= new Date()) {
      res.status(410).json({ error: "2FA challenge expired." });
      return;
    }

    challenge.attempts += 1;
    const expected = hashSensitive(`${payload.userId}:${payload.otp}`);
    if (expected !== challenge.otpHash) {
      await persist();
      res.status(401).json({ error: "Invalid OTP code." });
      return;
    }
    challenge.verifiedAt = new Date().toISOString();
    await persist();
    res.json({
      verified: true,
      challengeId: challenge.id,
      verifiedAt: challenge.verifiedAt,
    });
  });

  return router;
}
