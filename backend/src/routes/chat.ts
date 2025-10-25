// src/routes/chat.ts
import { Router } from "express";
import ChatMessage from "../models/ChatMessage";
import FAQCache, { makeFAQKey } from "../models/FAQCache";

const router = Router();

/** POST /api/chat
 * body: { message: string, userId?: string } // userId = roomId của bạn
 */
router.post("/", async (req, res) => {
  try {
    const { message, userId } = req.body || {};
    if (!message) return res.status(400).json({ error: "message required" });

    const roomId = userId || "guest_public";
    const key = makeFAQKey(message);

    // 1) tra cache
    const cached = await FAQCache.findOne({ qKey: key });
    if (cached) {
      cached.hits += 1;
      await cached.save();

      // ghi log chat
      await ChatMessage.create({ roomId, sender: "guest", senderName: "Khách", text: message });
      await ChatMessage.create({ roomId, sender: "bot", senderName: "Home Express Bot", text: cached.aText });

      return res.json({ reply: cached.aText, cached: true });
    }

    // 2) gọi bot thực sự (placeholder)
    const reply = await generateReply(message); 

    // 3) lưu chat + lưu cache
    await ChatMessage.create({ roomId, sender: "guest", senderName: "Khách", text: message });
    await ChatMessage.create({ roomId, sender: "bot", senderName: "Home Express Bot", text: reply });
    await FAQCache.updateOne(
      { qKey: key },
      { $set: { qKey: key, qText: message, aText: reply }, $inc: { hits: 1 } },
      { upsert: true }
    );

    return res.json({ reply, cached: false });
  } catch (err: any) {
    console.error("POST /api/chat error:", err);
    return res.status(500).json({ error: "internal_error", detail: err?.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    
    // 🔥 FIX: Lấy rooms với thông tin senderName chính xác
    const rooms = await ChatMessage.aggregate([
      {
        $match: {
          roomId: { $regex: /^guest_/, $exists: true }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" }, // 🔥 Sửa: $first thay vì $last vì đã sort -1
          messageCount: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
          // 🔥 THÊM: Lấy thông tin senderName từ tin nhắn gần nhất
          recentSenderName: { $first: "$senderName" }
        }
      },
      {
        $project: {
          roomId: "$_id",
          at: "$lastActivity",
          name: { 
            $cond: [
              { $and: ["$recentSenderName", { $ne: ["$recentSenderName", "Khách"] }] },
              "$recentSenderName",
              "$lastMessage.senderName"
            ]
          },
          lastMessage: "$lastMessage.text",
          messageCount: 1,
          _id: 0
        }
      },
      { $sort: { at: -1 } },
      { $limit: limit }
    ]);

    const roomsWithUnread = rooms.map(room => ({
      ...room,
      unreadCount: 0
    }));

    res.json({ rooms: roomsWithUnread });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/sync-rooms', async (req, res) => {
  try {
    // Lấy tất cả users có role Customer
    const users = await User.find({ role: 'Customer' }).select('_id email full_name');
    
    // Đảm bảo mỗi user có 1 room chat
    const syncResults = await Promise.all(
      users.map(async (user) => {
        const roomId = `guest_${user._id}`;
        
        // Kiểm tra room đã có tin nhắn chưa
        const existingMessage = await ChatMessage.findOne({ roomId });
        
        return {
          userId: user._id,
          email: user.email,
          full_name: user.full_name,
          roomId,
          hasChatHistory: !!existingMessage
        };
      })
    );

    res.json({ 
      success: true, 
      totalUsers: syncResults.length,
      rooms: syncResults 
    });
  } catch (error) {
    console.error('Error syncing rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// load lịch sử theo room
router.get("/history", async (req, res) => {
  try {
    const { roomId, limit = 200 } = req.query as any;
    if (!roomId) return res.status(400).json({ error: "roomId required" });
    const messages = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).limit(Number(limit));
    res.json({ messages });
  } catch (err: any) {
    console.error("GET /api/chat/history error:", err);
    res.status(500).json({ error: "internal_error", detail: err?.message });
  }
});

// thêm 1 endpoint lưu tay (nếu FE muốn gọi trực tiếp)
router.post("/append", async (req, res) => {
  try {
    const { roomId, sender, senderName, text } = req.body || {};
    if (!roomId || !sender || !text) return res.status(400).json({ error: "roomId/sender/text required" });
    const doc = await ChatMessage.create({ roomId, sender, senderName, text });
    res.json({ ok: true, id: doc._id });
  } catch (err: any) {
    console.error("POST /api/chat/append error:", err);
    res.status(500).json({ error: "internal_error", detail: err?.message });
  }
});

export default router;

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateReply(q: string): Promise<string> {
  const t = norm(q);

  // giá / bảng giá
  if (/(gia|bang gia|bao gia|chi phi|cuoc phi|gia ca)/.test(t)) {
    return [
      "Bảng giá tham khảo Home Express:",
      "• Truck 500kg: từ 200.000đ/chuyến (≤10km nội thành).",
      "• Truck 1500kg: từ 450.000đ/chuyến.",
      "• Truck 3000kg: từ 800.000đ/chuyến.",
      "Giá thực tế tuỳ quãng đường, số tầng, có thang máy/đóng gói. Bạn có thể gửi địa chỉ để mình ước tính nhanh."
    ].join("\n");
  }

  // đóng gói
  if (/(dong goi|dong goi do|dong thung|bao bi)/.test(t)) {
    return "Có ạ! Bên mình có dịch vụ đóng gói trọn gói (thùng, băng keo, chống sốc), tính theo khối lượng & số thùng. Bạn cần số lượng ước tính không?";
  }

  // hẹn giờ
  if (/(hen gio|dat lich|gio nao|khung gio|bao lau)/.test(t)) {
    return "Bạn có thể đặt lịch trước và chọn khung giờ. Thời gian phục vụ 08:00–21:00 hằng ngày. Xe đến sớm hơn 10–15 phút để hỗ trợ.";
  }

  // khu vực
  if (/(khu vuc|pham vi|noi thanh|ngoai thanh|tinh)/.test(t)) {
    return "Hiện hỗ trợ nội thành và liên tỉnh lân cận. Vui lòng cho biết điểm đi/điểm đến để mình check nhanh phí đường dài nhé.";
  }

  // hotline
  if (/(sdt|so dien thoai|hotline|lien he)/.test(t)) {
    return "Hotline Home Express: 08xx xxx xxx (8:00–21:00). Bạn cũng có thể để lại số, nhân viên sẽ gọi lại.";
  }

  // fallback thân thiện
  return "Mình chưa chắc câu này. Bạn có thể mô tả rõ hơn (địa chỉ, loại đồ, thời gian)?";
}