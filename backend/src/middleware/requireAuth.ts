import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Example auth guard. Replace with your existing JWT logic if you already have one.
 * It expects Authorization: Bearer <token> and decodes user payload.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    (req as any).user = payload.user || payload; // adjust to your token schema
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
