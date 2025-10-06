import { Router } from "express";
import { ChatMessage } from "../models/ChatMessage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 👉 Đây là prompt định hướng (system prompt)
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

router.post("/chat", async (req, res) => {
  const { message, userId = "guest" } = req.body;
  await ChatMessage.create({ userId, role: "user", text: message });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 👇 Gửi context + câu người dùng
    const prompt = `${SYSTEM_CONTEXT}\nNgười dùng: ${message}\nTrợ lý:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text() || "Xin lỗi, tôi chưa trả lời được.";

    await ChatMessage.create({ userId, role: "bot", text: reply });

    res.json({ reply });
  } catch (err: any) {
    console.error("❌ Gemini error:", err.message || err);
    res.status(500).json({
      reply:
        "❌ Lỗi khi gọi Gemini AI: " +
        (err.message || "Không xác định, hãy kiểm tra key hoặc model."),
    });
  }
});

export default router;
