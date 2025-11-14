// routes/chat.ts - Cập nhật để hỗ trợ customer roomId
import { Router } from "express";
import ChatMessage from "../models/ChatMessage";
import User from "../models/User";

const router = Router();

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const FAQ_REPLIES = [
  {
    keywords: ["gia", "bảng giá", "bao nhieu", "bao nhiêu"],
    reply:
      "Bảng giá Home Express phụ thuộc quãng đường, khối lượng đồ và dịch vụ kèm theo. Bạn có thể dùng mục Ước tính chi phí hoặc gửi thông tin để nhân viên báo giá chi tiết.",
  },
  {
    keywords: ["dat lich", "đặt lịch", "dat xe", "đặt xe"],
    reply:
      "Để đặt xe chuyển nhà, bạn chỉ cần tạo đơn trong mục \"Đặt dịch vụ\" và chọn thời gian mong muốn. Nhân viên sẽ xác nhận trong vòng 15 phút.",
  },
  {
    keywords: ["dong goi", "đóng gói", "bao bi"],
    reply:
      "Chúng tôi có gói hỗ trợ đóng gói, tháo lắp và bọc lót đồ dễ vỡ. Vui lòng mô tả nhu cầu để được tư vấn chính xác.",
  },
  {
    keywords: ["thoi gian", "bao lau", "mất bao lâu"],
    reply:
      "Thời gian vận chuyển trung bình 2-4 giờ trong nội thành. Lộ trình xa hơn sẽ được thông báo cụ thể khi xác nhận đơn.",
  },
];

router.post("/", async (req, res) => {
  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    const normalized = normalize(message);
    const matched =
      FAQ_REPLIES.find((faq) =>
        faq.keywords.some((kw) => normalized.includes(normalize(kw)))
      ) ?? null;

    const reply =
      matched?.reply ??
      "Cảm ơn bạn đã liên hệ Home Express. Nhân viên của chúng tôi sẽ hỗ trợ ngay khi bạn chuyển sang chế độ nhân viên.";

    res.json({ reply, matched: Boolean(matched) });
  } catch (err) {
    console.error("❌ Error generating bot reply:", err);
    res.status(500).json({ error: "Failed to generate reply" });
  }
});

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
    );

    res.json({ rooms: roomsWithCustomerInfo });
  } catch (err) {
    console.error("❌ Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});


export default router;
