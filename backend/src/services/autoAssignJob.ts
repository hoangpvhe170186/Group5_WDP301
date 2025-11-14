import cron from "node-cron";
import Order from "../models/Order";
import OrderStatusLog from "../models/OrderStatusLog";

// 🕒 Chạy mỗi 10s
cron.schedule("*/10 * * * * *", async () => {
  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 10 phút trước

    // 🔍 Tìm các đơn CONFIRMED mà chưa có carrier
    const confirmedOrders = await Order.find({
      status: { $regex: /^confirmed$/i },
      $or: [
        { carrier_id: { $exists: false } },
        { carrier_id: null },
      ],
    });

    const pendingOrders: typeof confirmedOrders = [];

    // 🔍 Kiểm tra thời gian từ OrderStatusLog - lấy log đầu tiên khi order chuyển sang "Confirmed"
    for (const order of confirmedOrders) {
      const confirmedLog = await OrderStatusLog.findOne({
        order_id: order._id,
        status: "CONFIRMED" // OrderStatusLog dùng "Confirmed" (chữ C hoa, còn lại thường)
      }).sort({ createdAt: 1 }); // Lấy log đầu tiên (sớm nhất)

      if (confirmedLog && confirmedLog.createdAt <= tenMinutesAgo) {
        // Đã quá 10 phút kể từ khi chuyển sang CONFIRMED
        pendingOrders.push(order);
      }
    }

    // ✅ Tự động chuyển các đơn quá 10 phút sang ASSIGNED
    for (const order of pendingOrders) {
      order.status = "ASSIGNED";
      order.auditLogs = order.auditLogs || [];
      order.auditLogs.push({
        at: new Date(),
        by: "system",
        action: "ASSIGNED_AUTO",
        note: "Tự động chuyển sang trạng thái 'ASSIGNED' sau 10 phút không có carrier nhận đơn (tính từ lúc chuyển sang CONFIRMED).",
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
