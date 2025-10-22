import mongoose from "mongoose";
import Order from "./models/Order.js"; // ✅ đường dẫn model của bạn

// Hàm tạo mã mới
function generateOrderCode() {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}-${randomPart}`;
}

(async () => {
  await mongoose.connect("mongodb://localhost:27017/ten_database_cua_ban"); // 🔄 thay URL DB

  const ordersWithoutCode = await Order.find({ orderCode: { $exists: false } });

  console.log(`🔍 Có ${ordersWithoutCode.length} đơn chưa có orderCode.`);

  for (const order of ordersWithoutCode) {
    order.orderCode = generateOrderCode();
    await order.save();
  }

  console.log("✅ Đã cập nhật xong tất cả đơn cũ!");
  mongoose.connection.close();
})();
