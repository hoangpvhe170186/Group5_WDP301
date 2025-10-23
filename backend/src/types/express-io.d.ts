// ✅ backend/src/types/express-io.d.ts
import "express-serve-static-core";
import type { Server as SocketIOServer } from "socket.io";

declare module "express-serve-static-core" {
  interface Request {
    io?: SocketIOServer;
  }
}
