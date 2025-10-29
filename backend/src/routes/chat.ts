// routes/chat.ts - Cập nhật để hỗ trợ customer roomId
import { Router } from "express";
import ChatMessage from "../models/ChatMessage";
import User from "../models/User";

const router = Router();

// ✅ Lấy lịch sử chat theo roomId (hỗ trợ cả order: và customer:)
router.get("/history", async (req, res) => {
  try {
    const { roomId, limit = 100 } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: "Missing roomId" });
    }

    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(Number(limit))
      .lean();

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

// ✅ Lấy danh sách rooms gần đây (có thêm thông tin customer)
router.get("/rooms", async (req, res) => {
  try {
    const { limit = 30 } = req.query;

    // Lấy tin nhắn gần nhất của mỗi room
    const recentMessages = await ChatMessage.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $limit: Number(limit),
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    // ✅ Thêm thông tin customer nếu room là customer:xxx
    const roomsWithCustomerInfo = await Promise.all(
      recentMessages.map(async (item) => {
        const roomId = item._id;
        const msg = item.lastMessage;

        let customerName = msg.senderName;

        // Nếu là room customer:xxx, lấy tên từ DB
        if (roomId.startsWith("customer:")) {
          const customerId = roomId.replace("customer:", "");
          try {
            const user = await User.findById(customerId).select("full_name").lean();
            if (user) {
              customerName = user.full_name;
            }
          } catch (err) {
            console.error("❌ Error fetching customer name:", err);
          }
        }

        return {
          roomId,
          preview: msg.text,
          name: msg.senderName,
          customerName,
          at: msg.createdAt,
        };
      })
    );

    res.json({ rooms: roomsWithCustomerInfo });
  } catch (err) {
    console.error("❌ Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

export default router;