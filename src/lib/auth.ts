import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "gaj_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "wedding-admin";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-wedding-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export async function verifyAdminPassword(password: string) {
  const configured = getAdminPassword();
  if (configured.startsWith("$2")) {
    return bcrypt.compare(password, configured);
  }
  const a = Buffer.from(password);
  const b = Buffer.from(configured);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSessionToken() {
  const payload = `admin:${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token?: string | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  try {
    const validSig = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
    if (!validSig) return false;
  } catch {
    return false;
  }
  const expiresAt = Number(payload.split(":")[1]);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return isValidSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error("UNAUTHORIZED");
  }
}

export { COOKIE_NAME };
