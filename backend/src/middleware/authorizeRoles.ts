import { Request, Response, NextFunction } from "express";
import { Role } from "../models/User";


export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any; // req.user được gắn từ middleware requireAuth

      if (!user || !user.role) {
        return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập." });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: "Bạn không có quyền truy cập vào tài nguyên này." 
        });
      }

      next();
    } catch (error) {
      console.error("authorizeRoles error:", error);
      return res.status(500).json({ success: false, message: "Lỗi kiểm tra quyền truy cập." });
    }
  };
};
