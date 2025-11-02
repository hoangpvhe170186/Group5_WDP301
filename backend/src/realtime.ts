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

    socket.on("join_seller", (sellerId: string) => {
      if (!sellerId) return;
      const room = `seller:${sellerId}`;
      socket.join(room);
      console.log(`👔 Seller joined ${room}`);
    });

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
<<<<<<< HEAD

    socket.on("join", (user) => {
      if (user.role === "carrier") {
        socket.join("carrier:all");
        socket.join(`carrier:${user.id}`);
        console.log(`🚚 Carrier ${user.id} joined carrier:all`);
      }
      if (user.role === "seller") {
        socket.join("seller:all");
        if (user.id) socket.join(`seller:${user.id}`);
        console.log(`🛍️ Seller ${user.id || "unknown"} joined seller:all`);
      }
=======
    
  socket.on("join", (user) => {
    if (user.role === "carrier") {
      socket.join("carrier:all");
      socket.join(`carrier:${user.id}`);
      console.log(`🚚 Carrier ${user.id} joined carrier:all`);
    }
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
>>>>>>> long
    });
  }
});

<<<<<<< HEAD
    // KH ping nhờ hỗ trợ
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

    // Typing indicator
    socket.on("typing", (data: TypingPayload) => {
      socket.to(data.roomId).emit("user_typing", {
        roomId: data.roomId,
        userId: data.userId,
        userName: data.userName,
        isTyping: data.isTyping
      });
    });

    // ✅ GỬI TIN NHẮN - QUAN TRỌNG
    socket.on("send_message", async (msg: SendMessagePayload) => {
      const { roomId, sender, text, name, userId, tempId } = msg;

      console.log("📨 Received send_message:", {
        roomId,
        sender,
        text: text.substring(0, 50),
        tempId,
        socketId: socket.id,
      });

      if (!roomId || !sender || !text?.trim()) {
        console.error("❌ Invalid message data");
        return;
      }

      try {
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
          tempId, // ✅ Truyền tempId để dedupe
          createdAt: new Date().toISOString(),
        };

        console.log("📤 Broadcasting message to room:", roomId);

        // 2) ✅ Phát tin nhắn đến TOÀN BỘ room (bao gồm cả người gửi)
        // Lý do: Customer cần nhận tin từ seller
        io.to(roomId).emit("receive_message", payload);

        // 3) ✅ Phát đến support_staff (để seller inbox nhận)
        socket.broadcast.to("support_staff").emit("receive_message", payload);

        // 4) Gửi badge cho staff khi khách gửi tin
        if (sender === "guest") {
          socket.broadcast.to("support_staff").emit("support_badge", {
            roomId,
            preview: text.slice(0, 60),
            name,
            at: new Date().toISOString(),
          });
        }

        console.log("✅ Message broadcasted successfully");

      } catch (err) {
        console.error("❌ Error saving/broadcasting message:", err);
      }
    });

    // ========================== 🚚 ORDER TRACKING ==========================
    socket.on("join_order", (orderId: string) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
      console.log(`📦 Joined order room: order:${orderId}`);
    });

    // (Optional) Khi cần seller chủ động nhận thông báo đơn mới
    socket.on("subscribe_orders", (sellerId: string) => {
      if (!sellerId) return;
      socket.join(`seller:${sellerId}`);
      console.log(`🧾 Seller subscribed to orders: seller:${sellerId}`);
    });

    // Xử lý ngắt kết nối
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, reason);
    });
=======
>>>>>>> long
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}