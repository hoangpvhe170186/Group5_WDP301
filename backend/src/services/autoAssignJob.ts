import cron from "node-cron";
import Order from "../models/Order";

// 🕒 Chạy mỗi 10s
cron.schedule("*/10 * * * * *", async () => {
  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // 🔍 Tìm các đơn pending quá 10 phút mà chưa có driver
    const pendingOrders = await Order.find({
      status: { $regex: /^pending$/i },
      $or: [
  { driver_id: { $exists: false } },
  { driver_id: null },
],
      createdAt: { $lte: tenMinutesAgo },
    });

    for (const order of pendingOrders) {
      order.status = "Assigned";
      order.auditLogs.push({
        at: new Date(),
        by: "system",
        action: "ASSIGNED_AUTO",
        note: "Tự động chuyển sang trạng thái assigned sau 10 phút không ai nhận.",
      });
      await order.save();
      console.log(`✅ Đã tự động chuyển đơn ${order._id} sang trạng thái 'assigned'`);
    }

    if (pendingOrders.length > 0) {
      console.log(`Tổng cộng ${pendingOrders.length} đơn đã được cập nhật.`);
    }
  } catch (err) {
    console.error("❌ Lỗi cron auto-assign:", err);
  }
});
