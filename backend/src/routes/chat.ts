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

<<<<<<< HEAD
    res.json({ messages });
  } catch (err) {
    console.error("❌ Error fetching chat history:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// ✅ Thêm tin nhắn vào DB
router.post("/append", async (req, res) => {
  try {
    const { roomId, sender, senderName, text } = req.body;

    if (!roomId || !sender || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await ChatMessage.create({
      roomId,
      sender,
      senderName,
      text,
      createdAt: new Date(),
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error("❌ Error appending message:", err);
    res.status(500).json({ error: "Failed to append message" });
  }
});

// ✅ Lấy danh sách rooms gần đây (có thêm thông tin customer hoặc guest)
router.get("/rooms", async (req, res) => {
  try {
    const { limit = 30 } = req.query;

    // Lấy tin nhắn gần nhất của mỗi room
    const recentMessages = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $limit: Number(limit) },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    // ⚙️ Bỏ qua room lỗi/null
    const validRooms = recentMessages.filter(
      (item) => typeof item._id === "string" && item._id.trim() !== ""
    );

    // ✅ Gắn thêm thông tin khách hàng
    const roomsWithCustomerInfo = await Promise.all(
      validRooms.map(async (item) => {
        const roomId = item._id;
        const msg = item.lastMessage;
        let customerName = msg?.senderName || "Khách hàng";

        // ⚙️ Nếu room là customer:xxx
        if (roomId.startsWith("customer:")) {
          const customerId = roomId.replace("customer:", "");
          if (customerId.startsWith("guest_")) {
            // ⚙️ Khách vãng lai, không có ObjectId
            customerName = `Khách vãng lai ${customerId.split("_")[1] || ""}`;
          } else {
            try {
              const user = await User.findById(customerId)
                .select("full_name")
                .lean();
              if (user && user.full_name) {
                customerName = user.full_name;
              }
            } catch (err) {
              console.warn(
                `⚠️ Bỏ qua tên khách vì ${customerId} không phải ObjectId`
              );
            }
          }
        }

        return {
          roomId,
          preview: msg?.text ?? "",
          name: msg?.senderName ?? "",
          customerName,
          at: msg?.createdAt ?? new Date(),
        };
      })
=======
    // 3) lưu chat + lưu cache
    await ChatMessage.create({ roomId, sender: "guest", senderName: "Khách", text: message });
    await ChatMessage.create({ roomId, sender: "bot", senderName: "Home Express Bot", text: reply });
    await FAQCache.updateOne(
      { qKey: key },
      { $set: { qKey: key, qText: message, aText: reply }, $inc: { hits: 1 } },
      { upsert: true }
>>>>>>> long
    );

    return res.json({ reply, cached: false });
  } catch (err: any) {
    console.error("POST /api/chat error:", err);
    return res.status(500).json({ error: "internal_error", detail: err?.message });
  }
});

<<<<<<< HEAD

export default router;
=======
router.get("/rooms", async (req, res) => {
  const limit = Number(req.query.limit ?? 100);

  const docs = await ChatMessage.aggregate([
    { $sort: { createdAt: -1 } },

    // lấy bản ghi mới nhất của từng room
    {
      $group: {
        _id: "$roomId",
        lastText: { $first: "$text" },
        lastAt: { $first: "$createdAt" },
      },
    },

    // tìm bản ghi GUEST mới nhất cho từng room
    {
      $lookup: {
        from: ChatMessage.collection.name,
        let: { rid: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ["$roomId", "$$rid"] },
            { $eq: ["$sender", "guest"] },
            { $ne: ["$senderName", null] },
          ]}}},
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, senderName: 1 } },
        ],
        as: "guestLast",
      }
    },

    // build output
    {
      $project: {
        _id: 0,
        roomId: "$_id",
        preview: "$lastText",
        at: "$lastAt",
        name: {
          $ifNull: [
            { $arrayElemAt: ["$guestLast.senderName", 0] },
            "Khách"
          ]
        }
      }
    },

    { $sort: { at: -1 } },
    { $limit: limit },
  ]);

  res.json({ rooms: docs });
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
>>>>>>> long
