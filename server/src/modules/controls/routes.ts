import { Router } from "express";
import { db, persist } from "../../db/store";
import { controlApproveSchema, controlTicketSchema } from "../../domain/schema";
import { parseBody } from "../../lib/http";
import { requireAuth, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { appendAuditEvent } from "../audit/service";
import { createControlTicket } from "./service";

export function controlsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/tickets", async (req: AuthedRequest, res) => {
    await db.read();
    const rows = db.data.controlTickets.filter(
      (t) => t.organizationId === req.auth?.organizationId,
    );
    res.json(rows);
  });

  router.post(
    "/tickets",
    requireRoles(["owner", "advisor", "compliance"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(controlTicketSchema, req, res);
      if (!payload) return;
      const ticket = createControlTicket(
        req.auth,
        payload.action,
        payload.targetEntityType,
        payload.targetEntityId,
        payload.requiredApprovals,
        payload.notes,
      );
      appendAuditEvent(db.data, req.auth, {
        eventType: "control.ticket.created",
        entityType: "control_ticket",
        entityId: ticket.id,
        after: ticket,
      });
      await persist();
      res.status(201).json(ticket);
    },
  );

  router.post(
    "/approve",
    requireRoles(["owner", "compliance"]),
    async (req: AuthedRequest, res) => {
      await db.read();
      if (!req.auth) return;
      const payload = parseBody(controlApproveSchema, req, res);
      if (!payload) return;
      const ticket = db.data.controlTickets.find(
        (t) =>
          t.id === payload.ticketId &&
          t.organizationId === req.auth?.organizationId &&
          t.status === "pending",
      );
      if (!ticket) {
        res.status(404).json({ error: "Pending control ticket not found." });
        return;
      }

      const before = { ...ticket };
      if (payload.decision === "reject") {
        ticket.status = "rejected";
        ticket.resolvedAt = new Date().toISOString();
        ticket.notes = payload.notes ?? ticket.notes;
      } else {
        if (!ticket.approverUserIds.includes(req.auth.userId)) {
          ticket.approverUserIds.push(req.auth.userId);
        }
        if (ticket.approverUserIds.length >= ticket.requiredApprovals) {
          ticket.status = "approved";
          ticket.resolvedAt = new Date().toISOString();
        }
      }
      appendAuditEvent(db.data, req.auth, {
        eventType: "control.ticket.updated",
        entityType: "control_ticket",
        entityId: ticket.id,
        before,
        after: ticket,
      });
      await persist();
      res.json(ticket);
    },
  );

  return router;
}
