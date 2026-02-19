import { db, persist } from "../db/store";
import { decryptAes256Gcm, encryptAes256Gcm } from "./crypto";

interface PiiPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

interface EncodedPayload {
  cipherText: string;
  iv: string;
  authTag: string;
}

export async function upsertPiiRecord(
  organizationId: string,
  entityType: "client" | "user" | "profile" | "log",
  entityId: string,
  payload: PiiPayload,
): Promise<string> {
  await db.read();
  const serialized = JSON.stringify(payload);
  const encrypted = encryptAes256Gcm(
    serialized,
    `${organizationId}:${entityType}:${entityId}`,
  );
  const compact = JSON.stringify({
    cipherText: encrypted.cipherText,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  });
  const existing = db.data.piiVault.find(
    (r) =>
      r.organizationId === organizationId &&
      r.entityType === entityType &&
      r.entityId === entityId,
  );
  if (existing) {
    existing.encryptedPayload = compact;
    existing.keyVersion = encrypted.keyVersion;
  } else {
    db.data.piiVault.push({
      id: crypto.randomUUID(),
      organizationId,
      entityType,
      entityId,
      encryptedPayload: compact,
      keyVersion: encrypted.keyVersion,
      createdAt: new Date().toISOString(),
    });
  }
  await persist();
  return `${entityType}:${entityId}`;
}

export async function readPiiRecord(
  organizationId: string,
  entityType: "client" | "user" | "profile" | "log",
  entityId: string,
): Promise<PiiPayload | null> {
  await db.read();
  const record = db.data.piiVault.find(
    (r) =>
      r.organizationId === organizationId &&
      r.entityType === entityType &&
      r.entityId === entityId,
  );
  if (!record) return null;
  const payload = JSON.parse(record.encryptedPayload) as EncodedPayload;
  const clear = decryptAes256Gcm(payload, `${organizationId}:${entityType}:${entityId}`);
  return JSON.parse(clear) as PiiPayload;
}
