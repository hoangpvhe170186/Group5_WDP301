import { NextFunction, Response } from "express";
import { Role } from "../models/User";

/**
 * Guard middleware to ensure the authenticated user owns one of the allowed roles.
 * Usage: router.use(requireAuth, requireRole(Role.Admin));
 */
export const requireRole =
  (...allowedRoles: Role[]) =>
  (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.length) {
      return next();
    }

    const userRole = String(req.user.role || "").toLowerCase();
    const allowed = allowedRoles.map((role) => role.toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };

