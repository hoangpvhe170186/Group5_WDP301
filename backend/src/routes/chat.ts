import { Router } from "express";
import ChatMessage from "../models/ChatMessage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const SYSTEM_CONTEXT = `
Bạn là trợ lý ảo tên **Home Express Bot**, đại diện cho nền tảng dịch vụ chuyển nhà Home Express tại Việt Nam.
Trang web cung cấp các dịch vụ:
- Vận chuyển nhà, chuyển trọ, chuyển văn phòng.
- Dịch vụ đóng gói, bốc xếp, cho thuê xe tải (500kg, 1 tấn, 2 tấn).
- Hỗ trợ khách hàng 24/7, minh bạch giá, đặt xe nhanh.

Nhiệm vụ của bạn:
- Chỉ trả lời về dịch vụ của Home Express.
- Nếu người dùng hỏi ngoài lĩnh vực, nhẹ nhàng hướng họ quay lại chủ đề vận chuyển.
- Giữ phong cách thân thiện, chuyên nghiệp, ngắn gọn, dễ hiểu.
`;

// --- Fallback nội bộ, không cần mạng ---
function fallbackReply(userText: string): string {
  const t = (userText || "").toLowerCase();
  if (/(giá|bảng giá|bao nhiêu)/.test(t))
    return "Bảng giá tham khảo: xe tải 500kg/1 tấn/2 tấn. Vui lòng cho mình điểm đi/đến và thời gian để báo giá chính xác nhé!";
  if (/(đặt xe|đặt lịch|book)/.test(t))
    return "Bạn có thể nhấn 'Đặt hàng ngay' và điền địa chỉ, thời gian. Nếu muốn, mình có thể kết nối bạn với nhân viên hỗ trợ.";
  if (/(đóng gói|bốc xếp)/.test(t))
    return "Home Express có dịch vụ đóng gói, bốc xếp trọn gói. Bạn cần tư vấn chi tiết gói dịch vụ nào ạ?";
  if (/(văn phòng|chuyển trọ|chuyển nhà)/.test(t))
    return "Bọn mình có gói chuyển nhà, chuyển trọ, chuyển văn phòng. Bạn cho mình biết số lượng đồ, tầng, và quãng đường dự kiến nhé.";
  // ngoài phạm vi → kéo về chủ đề
  return "Mình chỉ hỗ trợ các dịch vụ vận chuyển của Home Express (chuyển nhà/trọ/văn phòng, đóng gói, thuê xe tải). Bạn đang quan tâm dịch vụ nào ạ?";
}

router.post("/chat", async (req, res) => {
  try {
    const { message, userId, roomId: roomFromBody, name } = req.body as {
      message: string;
      userId?: string;
      roomId?: string;
      name?: string;
    };
    if (!message?.trim()) return res.status(400).json({ reply: "Bạn chưa nhập nội dung." });

    const roomId = String(roomFromBody || userId || "guest_temp");
    const guestName = name || "Khách";

    // Lưu tin KH
    await ChatMessage.create({
      roomId,
      sender: "guest",
      senderName: guestName,
      text: message.trim(),
    });

    const apiKey = process.env.GEMINI_API_KEY;
    let reply: string;

    if (!apiKey) {
      // ❗ Không có key → dùng fallback
      reply = fallbackReply(message);
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // hoặc "gemini-1.5-flash"
        const prompt = `${SYSTEM_CONTEXT}\n\nKhách hàng hỏi: "${message}"\n\nTrả lời ngắn gọn, thân thiện.`;
        const result = await model.generateContent(prompt);
        reply = result.response.text().trim() || fallbackReply(message);
      } catch (_e) {
        // ❗ Có key nhưng lỗi 403/429/... → vẫn fallback, không 500
        reply = fallbackReply(message);
      }
    }

    // Lưu bot
    await ChatMessage.create({
      roomId,
      sender: "bot",
      senderName: "Home Express Bot",
      text: reply,
    });

    return res.json({ reply });
  } catch (err) {
    console.error("❌ /api/chat error (unexpected):", err);
    // vẫn trả lời an toàn thay vì 500
    return res.json({
      reply:
        "Xin lỗi, hiện hệ thống đang bận. Bạn có thể cho mình biết nhu cầu chuyển nhà/trọ/văn phòng và thời gian dự kiến chứ ạ?",
    });
  }
});

export default router;
