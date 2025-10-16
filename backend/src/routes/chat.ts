// backend/src/routes/chat.ts
import { Router } from "express";
import ChatMessage from "../models/ChatMessage";

const router = Router();

// Lấy lịch sử chat theo roomId (dùng cho chế độ "agent")
router.get("/history", async (req, res) => {
  try {
    const roomId = String(req.query.roomId || "");
    const limit = Math.min(Number(req.query.limit || 100), 200);

    if (!roomId) {
      return res.status(400).json({ success: false, message: "Thiếu roomId" });
    }

    const docs = await ChatMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      messages: docs.map((m) => ({
        sender: m.sender,           // "guest" | "seller"
        text: m.text,
        name: (m as any).senderName,
        createdAt: m.createdAt,
      })),
    });
  } catch (e: any) {
    console.error("GET /api/chat/history error:", e?.message || e);
    return res.status(500).json({ success: false, message: "Không tải được lịch sử." });
  }
});

// Chatbot đơn giản (FE đang gọi POST /api/chat)
router.post("/", async (req, res) => {
  try {
    const { message, userId } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, message: "Thiếu message." });
    }
    const roomId = String(userId || `guest_${Date.now()}`);

    // Lưu câu hỏi của khách
    await ChatMessage.create({
      roomId,
      userId: roomId,
      sender: "guest",
      senderName: "Khách",
      text: message,
      createdAt: new Date(),
    });

    // Trả lời bot (FAQ tối giản — bạn có thể thay bằng AI sau)
    const reply = getBotReply(String(message));

    // Lưu câu trả lời bot (ghi vào sender "seller" để giao diện đang có nhìn giống agent)
    await ChatMessage.create({
      roomId,
      userId: roomId,
      sender: "seller",
      senderName: "Bot",
      text: reply,
      createdAt: new Date(),
    });

    return res.json({ success: true, reply });
  } catch (e: any) {
    console.error("POST /api/chat error:", e?.message || e);
    return res.status(500).json({ success: false, message: "Bot bị lỗi." });
  }
});

// FAQ tối giản
function getBotReply(q: string): string {
  const s = q.toLowerCase();

  if (s.includes("bảng giá") || s.includes("giá")) {
    return "Bảng giá tham khảo: Gói Nhỏ từ 450.000đ, Gói Tiêu Chuẩn từ 800.000đ, Gói Lớn từ 1.204.364đ. Bạn có thể vào trang 'Bảng giá' hoặc bấm 'Tính giá tự động'.";
  }
  if (s.includes("đặt xe") || s.includes("đặt đơn") || s.includes("đặt hàng")) {
    return "Bạn bấm 'Tạo đơn hàng', nhập địa chỉ lấy/giao, chọn gói rồi xác nhận. Hệ thống sẽ ước tính chi phí và kết nối tài xế gần nhất.";
  }
  if (s.includes("đóng gói") || s.includes("bốc xếp")) {
    return "Tụi mình có gói kèm 1–3 nhân công bốc xếp và dịch vụ đóng gói. Bạn chọn ở bước 'Chọn gói giá'.";
  }
  if (s.includes("hẹn giờ") || s.includes("lịch") || s.includes("thời gian")) {
    return "Có nhé! Bạn có thể đặt lịch trước theo khung giờ mong muốn. Tài xế sẽ liên hệ xác nhận trước khi đến.";
  }

  return "Mình đã ghi nhận câu hỏi. Bạn có thể nhấn 'Nói chuyện với nhân viên' để được hỗ trợ trực tiếp nhé!";
}

export default router;
