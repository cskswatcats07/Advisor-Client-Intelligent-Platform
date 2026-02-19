import { db, persist } from "../db/store";
import { hashSensitive } from "../security/crypto";
import { maskObject } from "../security/masking";

interface NetworkLogContext {
  organizationId?: string;
  actorUserId?: string;
}

export async function loggedFetch(
  input: string,
  init: RequestInit = {},
  context: NetworkLogContext = {},
): Promise<Response> {
  const started = Date.now();
  const method = init.method ?? "GET";
  const url = input;
  let statusCode: number | undefined;
  try {
    const response = await fetch(input, init);
    statusCode = response.status;
    return response;
  } finally {
    await db.read();
    db.data.apiLogs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      direction: "outbound",
      protocol: url.startsWith("https") ? "https" : "http",
      method,
      route: url,
      statusCode,
      durationMs: Date.now() - started,
      organizationId: context.organizationId,
      actorUserIdHash: context.actorUserId
        ? hashSensitive(context.actorUserId)
        : undefined,
      piiMaskApplied: true,
      maskedRequest: maskObject({
        headers: init.headers ?? {},
      }) as Record<string, unknown>,
    });
    await persist();
  }
}
