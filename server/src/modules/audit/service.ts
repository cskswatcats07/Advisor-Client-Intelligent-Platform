import type { AuthContext, AuditEvent, DbState } from "../../domain/types";
import { hashSensitive } from "../../security/crypto";

interface AuditInput {
  eventType: string;
  entityType: string;
  entityId: string;
  interactionId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, string | number | boolean>;
}

function retentionExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 7);
  return d.toISOString();
}

export function appendAuditEvent(state: DbState, auth: AuthContext, input: AuditInput): AuditEvent {
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorHash: hashSensitive(auth.userId),
    actorRole: auth.role,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    interactionId: input.interactionId,
    before: input.before,
    after: input.after,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
    retentionExpiresAt: retentionExpiry(),
  };
  state.auditEvents.push(event);
  return event;
}
