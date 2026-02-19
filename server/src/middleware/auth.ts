import type { NextFunction, Request, Response } from "express";
import { db } from "../db/store";
import type { AdvisorUser, AuthContext, Permission, UserRole } from "../domain/types";
import { ROLE_PERMISSIONS } from "../domain/types";

export interface AuthedRequest extends Request {
  auth?: AuthContext;
  authUser?: AdvisorUser;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  await db.read();
  const organizationId = req.header("x-org-id");
  const userId = req.header("x-user-id");
  if (!organizationId || !userId) {
    res.status(401).json({
      error: "Missing x-org-id or x-user-id headers.",
    });
    return;
  }

  const user = db.data.users.find(
    (u) => u.id === userId && u.organizationId === organizationId && u.active,
  );
  if (!user) {
    res.status(403).json({ error: "Invalid user or organization context." });
    return;
  }

  req.auth = { organizationId, userId, role: user.role };
  req.authUser = user;
  next();
}

export function requireRoles(roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: "Insufficient role for this operation." });
      return;
    }
    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const perms = ROLE_PERMISSIONS[req.auth.role] ?? [];
    if (!perms.includes(permission)) {
      res.status(403).json({
        error: `Missing permission: ${permission}`,
        role: req.auth.role,
      });
      return;
    }
    next();
  };
}
