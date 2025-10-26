import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import ChatMessage from "./models/ChatMessage";

let io: Server | undefined;

type SendMessagePayload = {
  roomId: string;
  sender: "guest" | "seller" | "bot";
  text: string;
  name?: string;   // tên hiển thị người gửi (khách/seller/bot)
  userId?: string; // nếu bạn muốn gắn thêm userId nội bộ
};

type SupportPayload = {
  roomId: string;
  preview?: string;
  name?: string;
};

export function initRealtime(server: HTTPServer) {
  io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // Seller/CS join vào kênh support
    socket.on("join_support", () => {
      socket.join("support_staff");
      console.log("Seller joined support_staff room");
    });

    // Client (mỗi khách/seller mở hội thoại) join 1 room cụ thể
    socket.on("join_room", (roomId: string) => {
      if (!roomId) return;
      socket.join(roomId);
    });
socket.on("join_driver_interview_room", () => {
      socket.join("driver_interview_notifications");
    });
    // KH ping nhờ hỗ trợ => bắn noti + badge tới staff
   socket.on("notify_support", (payload: SupportPayload) => {
  const data = {
    roomId: payload.roomId,
    preview: payload.preview ?? "Khách yêu cầu hỗ trợ",
    name: payload.name,
    at: new Date().toISOString(),
  };
  socket.broadcast.to("support_staff").emit("support_notification", data);
  socket.broadcast.to("support_staff").emit("support_badge", data);
});

    // GỬI TIN (thống nhất 1 handler duy nhất)
  socket.on("send_message", async (msg: SendMessagePayload) => {
  const { roomId, sender, text, name, userId } = msg;
  if (!roomId || !sender || !text?.trim()) return;

  // 1) Lưu DB
  await ChatMessage.create({
    roomId,
    userId,
    sender,
    senderName: name,
    text,
    createdAt: new Date(),
  });

  const payload = {
    roomId,
    sender,
    name,
    text,
    createdAt: new Date().toISOString(),
  };

  // 2) Phát realtime nhưng **loại trừ chính người gửi**
  socket.to(roomId).emit("receive_message", payload);                // loại trừ chính socket này
  socket.broadcast.to("support_staff").emit("receive_message", payload); // staff khác (không phát lại cho sender)

  // 3) Badge cho staff khi KH gửi (cũng **loại trừ sender**)
  if (sender === "guest") {
    socket.broadcast.to("support_staff").emit("support_badge", {
      roomId,
      preview: text.slice(0, 60),
      name,
      at: new Date().toISOString(),
    });
  }
});

  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}