import type { NextFunction, Request, Response } from "express";
import { db } from "../db/store";
import type { FdxAccessToken } from "../domain/types";

export interface FdxRequest extends Request {
  fdxToken?: FdxAccessToken;
}

export async function requireFdxToken(
  req: FdxRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await db.read();
  const auth = req.header("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token) {
    res.status(401).json({
      errors: [
        {
          code: "401",
          title: "Unauthorized",
          detail: "Missing bearer token.",
        },
      ],
    });
    return;
  }

  const accessToken = db.data.fdxAccessTokens.find((t) => t.token === token);
  if (!accessToken) {
    res.status(401).json({
      errors: [
        {
          code: "401",
          title: "Unauthorized",
          detail: "Invalid bearer token.",
        },
      ],
    });
    return;
  }

  if (new Date(accessToken.expiresAt) <= new Date()) {
    res.status(401).json({
      errors: [
        {
          code: "401",
          title: "Unauthorized",
          detail: "Bearer token expired.",
        },
      ],
    });
    return;
  }

  req.fdxToken = accessToken;
  next();
}
