import type { NextFunction, Request, Response } from "express";

const windowMs = 60_000;
const maxRequests = 120;

const store = new Map<string, { count: number; windowStart: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs * 2) store.delete(key);
  }
}, windowMs * 2);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.header("x-user-id") ?? req.ip ?? "anon";
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    entry = { count: 1, windowStart: now };
    store.set(key, entry);
  } else {
    entry.count++;
  }

  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil((entry.windowStart + windowMs) / 1000));

  if (entry.count > maxRequests) {
    res.status(429).json({ error: "Too many requests. Please wait before retrying." });
    return;
  }
  next();
}
