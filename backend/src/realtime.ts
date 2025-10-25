import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import ChatMessage from "./models/ChatMessage";

let io: Server | undefined;

type SendMessagePayload = {
  roomId: string;
  sender: "guest" | "seller" | "bot";
  text: string;
  name?: string;
  userId?: string;
  tempId?: string;
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

    // Seller/CS join vào kênh support (để nhận badge/list update)
    socket.on("join_support", () => {
      socket.join("support_staff");
    });

    // Join/leave phòng hội thoại cụ thể
    socket.on("join_room", (roomId: string) => {
      if (!roomId) return;
      socket.join(roomId);
    });
    socket.on("leave_room", (roomId: string) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    // KH ping nhờ hỗ trợ (để bật badge)
    socket.on("notify_support", (payload: SupportPayload) => {
      const data = {
        roomId: payload.roomId,
        preview: payload.preview ?? "Khách yêu cầu hỗ trợ",
        name: payload.name,
        at: new Date().toISOString(),
      };
      // event dành riêng cho badge/notification
      socket.broadcast.to("support_staff").emit("support_notification", data);
      socket.broadcast.to("support_staff").emit("support_badge", data);
    });

    // GỬI TIN NHẮN
    socket.on("send_message", async (msg: SendMessagePayload) => {
      const { roomId, sender, text, name, userId, tempId } = msg;

      if (!roomId || !sender || !text?.trim()) return;

      // (Tùy chọn) chặn duplicate gần đây trong DB
      const duplicateCheck = await ChatMessage.findOne({
        roomId,
        text: text.trim(),
        sender,
        createdAt: { $gte: new Date(Date.now() - 10_000) },
      });
      if (duplicateCheck) {
        console.log("Skip duplicate in DB");
        return;
      }

      try {
        const createdAt = new Date();
        const saved = await ChatMessage.create({
          roomId,
          userId,
          sender,
          senderName: name,
          text: text.trim(),
          createdAt,
        });

        const payload = {
          id: tempId || saved._id.toString(),
          roomId,
          sender,
          name,
          text: saved.text,
          createdAt: saved.createdAt.toISOString(),
          savedId: saved._id,
          tempId,
        };

        // ❗ Chỉ bắn chat thật vào PHÒNG HỘI THOẠI
        io?.to(roomId).emit("receive_message", payload);

        // ❗ Cập nhật danh sách cho đội support bằng EVENT KHÁC TÊN
        //   -> tránh client đang join cả roomId lẫn support_staff nhận đôi cùng event
        const preview = saved.text.length > 80 ? saved.text.slice(0, 80) + "…" : saved.text;
        socket.broadcast.to("support_staff").emit("support_inbox_update", {
          roomId,
          preview,
          name,
          sender,
          at: payload.createdAt,
        });
      } catch (err) {
        console.error("send_message error:", err);
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}
