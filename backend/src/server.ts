<<<<<<< HEAD
import http from "http";
import { connectMongo } from "./db/mongo";
import { config } from "./config";
import app from "./app";
import { createSocketServer } from "./realtime/socket"; 
=======
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { connectMongo } from "./db/mongo";
import { config } from "./config";
import ChatMessage from "./models/ChatMessage";
// (tuỳ chọn) định nghĩa kiểu payload để code gọn hơn
type SupportNotify = { roomId: string; preview?: string; name?: string };
type ChatPayload = { roomId: string; sender: "guest" | "seller"; text: string; name?: string };
>>>>>>> 6fb95fb (mess realtime: customer with seller)

async function start() {
  const server = http.createServer(app);
  createSocketServer(server); // khởi tạo Socket.IO bám vào server

  try {
    await connectMongo();
<<<<<<< HEAD
    server.listen(config.PORT, () => {   // DÙNG server.listen
      console.log(`🚀 API ready at http://localhost:${config.PORT}`);
=======

    // Tạo HTTP server để gắn cả Express + Socket.IO
    const server = createServer(app);

    const io = new Server(server, {
      cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
      // (tuỳ chọn) tinh chỉnh timeout cho ổn định hơn
      pingTimeout: 20000,
      pingInterval: 25000,
    });

   io.on("connection", (socket) => {
  socket.on("join_support", () => socket.join("support"));
  socket.on("join_room", (roomId: string) => socket.join(roomId));

  socket.on("notify_support", (payload: { roomId: string; preview?: string; name?: string }) => {
    io.to("support").emit("support_notification", {
      roomId: payload.roomId,
      preview: payload.preview ?? "Khách yêu cầu hỗ trợ",
      name: payload.name,
      at: new Date().toISOString(),
    });
  });

  socket.on(
    "send_message",
    async (payload: { roomId: string; sender: "guest" | "seller"; text: string; name?: string; userId?: string }) => {
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

      // 2) Phát cho phía còn lại (kèm roomId để client tự map)
      socket.to(roomId).emit("receive_message", {
        roomId,
        sender,
        name,
        text,
        createdAt: new Date().toISOString(),
      });

      // 3) Badge cho seller chỉ khi KH gửi
      if (sender === "guest") {
        io.to("support").emit("support_badge", {
          roomId,
          preview: text.slice(0, 60),
          name,
          at: new Date().toISOString(),
        });
      }
    }
  );


      socket.on("disconnect", () => {
        // you can log or clean resources here
      });
    });

    // BẮT BUỘC: lắng nghe cổng
    const PORT = Number(config.PORT) || 4000;
    server.listen(PORT, () => {
      console.log(`🚀 API & Socket ready at http://localhost:${PORT}`);
>>>>>>> 6fb95fb (mess realtime: customer with seller)
    });
  } catch (err) {
    console.error("💥 Boot error:", err);
    process.exit(1);
  }
}

start();