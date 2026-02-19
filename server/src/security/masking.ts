import { maskAddress, maskEmail, maskName, maskPhone } from "./crypto";

const SENSITIVE_KEYS = new Set([
  "email",
  "emailMasked",
  "phone",
  "phoneMasked",
  "address",
  "addressMasked",
  "fullName",
  "fullNameMasked",
  "dateOfBirth",
  "userId",
  "x-user-id",
]);

type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null;

export function maskObject(input: JsonLike): JsonLike {
  if (Array.isArray(input)) return input.map((x) => maskObject(x as JsonLike));
  if (!input || typeof input !== "object") return input;
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && SENSITIVE_KEYS.has(key)) {
      if (key.toLowerCase().includes("email")) out[key] = maskEmail(value);
      else if (key.toLowerCase().includes("phone")) out[key] = maskPhone(value);
      else if (key.toLowerCase().includes("address")) out[key] = maskAddress(value);
      else if (key.toLowerCase().includes("name")) out[key] = maskName(value);
      else out[key] = "***";
      continue;
    }
    if (Array.isArray(value) || (value && typeof value === "object")) {
      out[key] = maskObject(value as JsonLike);
      continue;
    }
    out[key] = value;
  }
  return out;
}
