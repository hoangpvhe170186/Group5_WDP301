// src/realtime.ts
import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import ChatMessage from "./models/ChatMessage";

let io: Server | undefined;

export function initRealtime(server: HTTPServer) {
  io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("join_support", () => socket.join("support"));
    socket.on("join_room", (roomId: string) => socket.join(roomId));

    socket.on(
      "notify_support",
      (payload: { roomId: string; preview?: string; name?: string }) => {
        io!.to("support").emit("support_notification", {
          roomId: payload.roomId,
          preview: payload.preview ?? "Khách yêu cầu hỗ trợ",
          name: payload.name,
          at: new Date().toISOString(),
        });
      }
    );

    socket.on(
      "send_message",
      async (payload: {
        roomId: string;
        sender: "guest" | "seller";
        text: string;
        name?: string;
        userId?: string;
      }) => {
        const { roomId, sender, text, name, userId } = payload;

        // 1) Lưu DB
        await ChatMessage.create({
          roomId,
          userId,
          sender,
          senderName: name,
          text,
          createdAt: new Date(),
        });

        // 2) Phát cho các client khác trong room
        socket.to(roomId).emit("receive_message", {
          roomId,
          sender,
          name,
          text,
          createdAt: new Date().toISOString(),
        });

        // 3) Badge cho seller khi KH gửi
        if (sender === "guest") {
          io!.to("support").emit("support_badge", {
            roomId,
            preview: text.slice(0, 60),
            name,
            at: new Date().toISOString(),
          });
        }
      }
    );
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}
