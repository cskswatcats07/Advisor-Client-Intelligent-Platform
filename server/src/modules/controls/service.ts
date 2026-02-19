import { db } from "../../db/store";
import type { AuthContext, ControlTicket } from "../../domain/types";

export function policyRequiredApprovals(
  organizationId: string,
  action: string,
): 0 | 2 | 4 {
  const policy = db.data.securityPolicies.find((p) => p.organizationId === organizationId);
  if (!policy) return 0;
  if (policy.strictFourEyeActions.includes(action)) return 4;
  if (policy.strictTwoEyeActions.includes(action)) return 2;
  return 0;
}

export function findApprovedTicket(
  organizationId: string,
  action: string,
  entityType: string,
  entityId: string,
): ControlTicket | undefined {
  return db.data.controlTickets.find(
    (t) =>
      t.organizationId === organizationId &&
      t.action === action &&
      t.targetEntityType === entityType &&
      t.targetEntityId === entityId &&
      t.status === "approved",
  );
}

export function createControlTicket(
  auth: AuthContext,
  action: string,
  entityType: string,
  entityId: string,
  requiredApprovals: 2 | 4,
  notes?: string,
): ControlTicket {
  const ticket: ControlTicket = {
    id: crypto.randomUUID(),
    organizationId: auth.organizationId,
    action,
    targetEntityType: entityType,
    targetEntityId: entityId,
    requestedByUserId: auth.userId,
    requiredApprovals,
    approverUserIds: [],
    status: "pending",
    createdAt: new Date().toISOString(),
    notes,
  };
  db.data.controlTickets.push(ticket);
  return ticket;
}

export function requireControlApproval(
  auth: AuthContext,
  action: string,
  entityType: string,
  entityId: string,
  controlTicketId?: string,
):
  | { allowed: true }
  | {
      allowed: false;
      requiredApprovals: 2 | 4;
      message: string;
    } {
  const required = policyRequiredApprovals(auth.organizationId, action);
  if (required === 0) return { allowed: true };
  if (!controlTicketId) {
    return {
      allowed: false,
      requiredApprovals: required,
      message:
        "Control ticket approval required. Provide x-control-ticket-id header for this action.",
    };
  }
  const ticket = db.data.controlTickets.find(
    (t) =>
      t.id === controlTicketId &&
      t.organizationId === auth.organizationId &&
      t.action === action &&
      t.targetEntityType === entityType &&
      t.targetEntityId === entityId &&
      t.status === "approved",
  );
  if (!ticket) {
    return {
      allowed: false,
      requiredApprovals: required,
      message: "Approved control ticket not found for this action/entity.",
    };
  }
  return { allowed: true };
}
