// backend/src/server.ts
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { connectMongo } from "./db/mongo";
import { config } from "./config";
import ChatMessage from "./models/ChatMessage";

// Kiểu dữ liệu gọn gàng
type SupportNotify = { roomId: string; preview?: string; name?: string };
type ChatPayload = {
  roomId: string;
  sender: "guest" | "seller";
  text: string;
  name?: string;
  userId?: string;
};

async function start() {
  // 1) Kết nối DB trước (nếu fail thì thoát sớm)
  await connectMongo();

  // 2) Tạo HTTP server một lần duy nhất
  const server = createServer(app);

  // 3) Gắn Socket.IO vào server
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // chỉnh theo FE
      methods: ["GET", "POST"],
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // 4) Sự kiện socket
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("join_support", () => socket.join("support"));
    socket.on("join_room", (roomId: string) => socket.join(roomId));

    socket.on("notify_support", (payload: SupportNotify) => {
      io.to("support").emit("support_notification", {
        roomId: payload.roomId,
        preview: payload.preview ?? "Khách yêu cầu hỗ trợ",
        name: payload.name,
        at: new Date().toISOString(),
      });
    });

    socket.on("send_message", async (payload: ChatPayload) => {
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
        io.to("support").emit("support_badge", {
          roomId,
          preview: text.slice(0, 60),
          name,
          at: new Date().toISOString(),
        });
      }
    });

    socket.on("disconnect", () => {
      // cleanup nếu cần
    });
  });

  // 5) Lắng nghe cổng
  const PORT = Number(config.PORT) || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 API & Socket ready at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("💥 Boot error:", err);
  process.exit(1);
});
