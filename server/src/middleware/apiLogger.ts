import type { NextFunction, Request, Response } from "express";
import { db, persist } from "../db/store";
import { hashSensitive } from "../security/crypto";
import { maskObject } from "../security/masking";
import { upsertPiiRecord } from "../security/piiVault";

export async function apiLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const started = Date.now();
  const maskedRequest = maskObject({
    headers: {
      "x-org-id": req.header("x-org-id"),
      "x-user-id": req.header("x-user-id"),
      "user-agent": req.header("user-agent"),
    },
    query: req.query as Record<string, unknown>,
    body: req.body as Record<string, unknown>,
  }) as Record<string, unknown>;
  const orgId = req.header("x-org-id") ?? undefined;
  const userId = req.header("x-user-id") ?? undefined;
  const userHash = userId ? hashSensitive(userId) : undefined;

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    const maskedResponse = maskObject(body as Record<string, unknown>) as Record<
      string,
      unknown
    >;
    void (async () => {
      await db.read();
      let encryptedRefId: string | undefined;
      if (orgId && userId) {
        encryptedRefId = await upsertPiiRecord(orgId, "log", crypto.randomUUID(), {
          email:
            typeof (req.body as Record<string, unknown>)?.email === "string"
              ? ((req.body as Record<string, unknown>).email as string)
              : undefined,
          phone:
            typeof (req.body as Record<string, unknown>)?.phone === "string"
              ? ((req.body as Record<string, unknown>).phone as string)
              : undefined,
          address:
            typeof (req.body as Record<string, unknown>)?.address === "string"
              ? ((req.body as Record<string, unknown>).address as string)
              : undefined,
          fullName:
            typeof (req.body as Record<string, unknown>)?.fullName === "string"
              ? ((req.body as Record<string, unknown>).fullName as string)
              : undefined,
        });
      }
      db.data.apiLogs.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        direction: "inbound",
        protocol: req.secure ? "https" : "http",
        method: req.method,
        route: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - started,
        organizationId: orgId,
        actorUserIdHash: userHash,
        piiMaskApplied: true,
        maskedRequest,
        maskedResponse,
        encryptedSensitiveRefId: encryptedRefId,
      });
      await persist();
    })();
    return originalJson(body);
  }) as typeof res.json;

  next();
}
