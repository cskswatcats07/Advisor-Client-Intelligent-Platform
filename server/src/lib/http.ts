import type { Request, Response } from "express";
import type { ZodSchema } from "zod";

export function parseBody<T>(schema: ZodSchema<T>, req: Request, res: Response): T | null {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request payload.",
      details: parsed.error.flatten(),
    });
    return null;
  }
  return parsed.data;
}
