// src/realtime/socket.ts
import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import Message from "../models/Message";
import Conversation from "../models/Conversation";
// TODO: import Order/User service để check quyền truy cập room

type UserPayload = { userId: string; role: "customer"|"staff"|"driver" };

export function createSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: { origin: ["http://localhost:5173","http://localhost:3000"], credentials: true },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.toString().replace("Bearer ", "");
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
      (socket.data as any).user = payload;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket.data as any).user as UserPayload;

    socket.on("join_order", async (orderId: string) => {
      // TODO: kiểm tra user có thuộc orderId không (DB)
      // if (!(await canAccessOrder(user.userId, orderId))) return socket.disconnect(true);
      await Conversation.findOneAndUpdate(
        { order_id: orderId },
        { $setOnInsert: { order_id: orderId }, $addToSet: { members: user.userId } },
        { upsert: true }
      );
      socket.join(String(orderId));
      socket.emit("system", { type: "joined", orderId });
    });

    socket.on("message:send", async (p: {
      orderId: string;
      type?: "text"|"image"|"file"|"system";
      text?: string;
      media?: { url: string; type?: string };
      clientMsgId?: string;
    }) => {
      const { orderId, type = "text", text, media, clientMsgId } = p;
      if (type === "text" && !text?.trim()) return;

      // Lưu DB
      const msg = await Message.create({
        order_id: orderId,
        sender_id: user.userId,
        type,
        text,
        media,
        status: "sent",
      });

      // Cập nhật lastMessage
      await Conversation.findOneAndUpdate(
        { order_id: orderId },
        { lastMessage: { text: text ?? (media ? "[media]" : ""), sender_id: user.userId, at: new Date() } },
        { upsert: true }
      );

      // Phát về room
      io.to(String(orderId)).emit("message:new", { ...msg.toObject(), clientMsgId });
    });

    socket.on("typing:start", (orderId: string) => {
      socket.to(String(orderId)).emit("typing", { userId: user.userId, isTyping: true });
    });
    socket.on("typing:stop", (orderId: string) => {
      socket.to(String(orderId)).emit("typing", { userId: user.userId, isTyping: false });
    });

    socket.on("message:seen", async (d: { orderId: string; messageIds: string[] }) => {
      await Message.updateMany(
        { _id: { $in: d.messageIds } },
        { $set: { status: "seen" } }
      );
      socket.to(String(d.orderId)).emit("message:seen:update", {
        userId: user.userId, messageIds: d.messageIds,
      });
    });
  });

  return io;
}
