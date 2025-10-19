import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await User.findById(payload.userId);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = { id: user._id.toString(), role: user.role }; // ✅ Gán đúng `id`
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
