import { getIO } from "../realtime";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware thêm socket.io instance vào req
 * để controller có thể emit realtime event (vd: order:claimed)
 */
export const withIO = (req: Request, res: Response, next: NextFunction) => {
  (req as any).io = getIO();
  next();
};
