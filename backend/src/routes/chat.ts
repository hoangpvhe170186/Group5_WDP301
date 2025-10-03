import { Router } from "express";
import { ChatMessage } from "../models/ChatMessage";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", async (req, res) => {
  const { message, userId = "guest" } = req.body;

  // Lưu tin nhắn user
  await ChatMessage.create({ userId, role: "user", text: message });

  try {
    // Gọi OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",   // có thể đổi sang gpt-4 nếu muốn
      messages: [{ role: "user", content: message }],
    });

    const botReply =
      completion.choices[0].message?.content ||
      "Xin lỗi, tôi chưa trả lời được.";

    // Lưu phản hồi bot
    await ChatMessage.create({ userId, role: "bot", text: botReply });

    res.json({ reply: botReply });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    res.status(500).json({ reply: "❌ Lỗi khi gọi AI." });
  }
});

// API chuyển sang người thật
router.post("/chat/handoff", async (req, res) => {
  const { userId = "guest" } = req.body;
  // Có thể tạo ticket cho nhân viên trong DB
  res.json({ ok: true, message: "Đã chuyển sang nhân viên hỗ trợ." });
});

export default router;
