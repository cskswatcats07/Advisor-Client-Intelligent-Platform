import crypto from "node:crypto";

const DEFAULT_KEY_MATERIAL = "local-dev-aes-256-gcm-key-material-change-me";
const DEFAULT_HASH_PEPPER = "local-dev-hash-pepper-change-me";

function keyMaterial(): string {
  return process.env.PII_AES256GCM_KEY ?? DEFAULT_KEY_MATERIAL;
}

function hashPepper(): string {
  return process.env.HASH_PEPPER ?? DEFAULT_HASH_PEPPER;
}

function deriveAesKey(material: string): Buffer {
  return crypto.createHash("sha256").update(material, "utf8").digest();
}

export function encryptAes256Gcm(
  plainText: string,
  associatedData?: string,
): { cipherText: string; iv: string; authTag: string; keyVersion: string } {
  const iv = crypto.randomBytes(12);
  const key = deriveAesKey(keyMaterial());
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  if (associatedData) {
    cipher.setAAD(Buffer.from(associatedData, "utf8"));
  }
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cipherText: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: tag.toString("base64"),
    keyVersion: "v1",
  };
}

export function decryptAes256Gcm(
  payload: { cipherText: string; iv: string; authTag: string },
  associatedData?: string,
): string {
  const key = deriveAesKey(keyMaterial());
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
  );
  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData, "utf8"));
  }
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hashSensitive(value: string): string {
  return crypto
    .createHash("sha256")
    .update(`${hashPepper()}::${value}`)
    .digest("hex");
}

export function maskEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const [name, domain] = email.split("@");
  if (!name || !domain) return "***";
  return `${name.slice(0, 1)}***@${domain}`;
}

export function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***-***-${digits.slice(-4)}`;
}

export function maskAddress(address?: string): string | undefined {
  if (!address) return undefined;
  return `**** ${address.slice(-12)}`;
}

export function maskName(name?: string): string | undefined {
  if (!name) return undefined;
  const parts = name.split(" ").filter(Boolean);
  return parts.map((p) => `${p.slice(0, 1)}***`).join(" ");
}
