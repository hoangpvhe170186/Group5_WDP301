import cron from "node-cron";
import Order from "../models/Order";

// 🕒 Chạy mỗi 10s
cron.schedule("*/10 * * * * *", async () => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 phút trước

    // 🔍 Tìm các đơn CONFIRMED quá 10 phút mà chưa có carrier
    const pendingOrders = await Order.find({
      status: { $regex: /^confirmed$/i },
      $or: [
        { carrier_id: { $exists: false } },
        { carrier_id: null },
      ],
      createdAt: { $lte: thirtyMinutesAgo },
    });

    for (const order of pendingOrders) {
      order.status = "ASSIGNED";
      order.auditLogs.push({
        at: new Date(),
        by: "system",
        action: "ASSIGNED_AUTO",
        note: "Tự động chuyển sang trạng thái 'ASSIGNED' sau 10 phút không có carrier nhận đơn.",
      });
      await order.save();
      console.log(`✅ Đã tự động chuyển đơn ${order._id} sang trạng thái 'ASSIGNED'`);
    }

    if (pendingOrders.length > 0) {
      console.log(`Tổng cộng ${pendingOrders.length} đơn đã được cập nhật.`);
    }
  } catch (err) {
    console.error("❌ Lỗi cron auto-assign:", err);
  }
});
