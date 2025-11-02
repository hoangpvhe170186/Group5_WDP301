import { Request, Response } from "express";
import Order from "../models/Order"; // đảm bảo đã có model Order.ts
import OrderItem from "../models/OrderItem";
import PricePackage from "../models/PricePackage";
import mongoose from "mongoose";
import OrderStatusLog from "../models/OrderStatusLog";
import OrderTracking from "../models/OrderTracking";

export const createTemporaryOrder = async (req, res) => {
  try {
    const {
      customer_id,
      phone,
      package_id,
      pickup_address,
      delivery_address,
      total_price,
    } = req.body;

    if (!customer_id || !phone || !package_id || !pickup_address || !delivery_address) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin đơn hàng." });
    }

    // ✅ Tính tổng phụ phí
    let extraFeeTotal = 0;
    if (Array.isArray(extra_fees) && extra_fees.length > 0) {
      extraFeeTotal = extra_fees.reduce(
        (sum, f) => sum + Number(f.price || 0),
        0
      );
    }

    const finalPrice = Number(total_price) + extraFeeTotal;
    const pkg = await PricePackage.findById(package_id);
    if (!pkg) return res.status(404).json({ success: false, message: "Không tìm thấy gói giá." });

    // ✅ Tạo đơn
    const order = await Order.create({
      customer_id,
      phone,
      package_id,
      pickup_address,
      delivery_address,
      total_price,
      status: "Pending",
      total_price: finalPrice,
      extra_fees: extra_fees.filter((x) => x)
    });
    
    

    // 🟩 Gán mã đơn hàng sau khi tạo
    function generateOrderCode(prefix = "ORD") {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      const year = new Date().getFullYear().toString().slice(-2);
      return `${prefix}-${year}-${rand}`;
    }

    order.orderCode = generateOrderCode();
    await order.save();


    // ✅ Trả về kết quả
    res.json({ success: true, message: "Tạo đơn hàng thành công ✅", order });
  } catch (err) {
    console.error("❌ Lỗi khi tạo đơn hàng tạm:", err);
    res.status(500).json({ success: false, message: "Không thể tạo đơn hàng tạm." });
  }
};


// ✅ Thêm chi tiết hàng hóa (OrderItem)
//  Thêm chi tiết hàng hóa (OrderItem)
export const addOrderItems = async (req, res) => {
  try {
    const { order_id, items, delivery_schedule } = req.body;

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin chi tiết hàng hóa." });
    }

    // ✅ Kiểm tra đơn hàng có tồn tại
    const order = await Order.findById(order_id).populate("package_id");
    if (!order)
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    // ✅ Kiểm tra tổng khối lượng không vượt quá capacity
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const maxCapacity = Number(order.package_id?.vehicle?.capacity || 0);

    if (maxCapacity && totalWeight > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Tổng khối lượng ${totalWeight}kg vượt quá giới hạn ${maxCapacity}kg của gói.`,
      });
    }

    // ✅ Thêm danh sách hàng hóa
    const insertedItems = await OrderItem.insertMany(
      items.map((item) => ({
        order_id,
        description: item.description,
        quantity: item.quantity,
        weight: item.weight,
        fragile: item.fragile || false,
      }))
    );

    // ✅ Cập nhật lịch giao hàng
    if (delivery_schedule) {
      const { type, datetime } = delivery_schedule;

      if (type === "later" && datetime) {
        order.scheduled_time = new Date(datetime);
      } else {      
        const now = new Date();
        const estimated = new Date(now.getTime() + 2 * 60 * 60 * 1000); 
        order.scheduled_time = estimated;
      }
    }

    //  Cập nhật trạng thái
    order.status = "Pending";
    await order.save();

    return res.json({
      success: true,
      message: "Đã thêm chi tiết hàng hóa và cập nhật lịch giao hàng thành công.",
      order,
      items: insertedItems,
    });
  } catch (err) {
    console.error("❌ Lỗi khi thêm hàng hóa:", err);
    res.status(500).json({ success: false, message: "Không thể thêm chi tiết hàng hóa." });
  }
};
//  Tạo đơn hàng mới
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      pickup_address,
      delivery_address,
      pickup_detail,
      total_price,
      package_id,
      phone,
      extra_fees = [],
      scheduleType = "now",
      scheduled_time,
    } = req.body;

    // 🔍 Kiểm tra dữ liệu đầu vào
    if (!customer_id || !pickup_address || !delivery_address || !phone || !package_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc để tạo đơn hàng.",
      });
    }

    // ✅ Xác định thời gian giao hàng
    let finalScheduledTime: Date;
    if (scheduleType === "later" && scheduled_time) {
      finalScheduledTime = new Date(scheduled_time);
    } else {
      // Nếu không chọn lịch -> giao sau 2 tiếng
      finalScheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }

    // ✅ Xử lý phụ phí (lọc bỏ id không hợp lệ)
    const validExtraFees = Array.isArray(extra_fees)
      ? extra_fees.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    // ✅ Tạo đơn hàng
    const order = await Order.create({
      customer_id,
      pickup_address,
      pickup_detail,
      delivery_address,
      total_price,
      package_id,
      phone,
      scheduled_time: finalScheduledTime,
      extra_fees: validExtraFees,
      status: "Pending",
      isPaid: false,
    });

    //  Tạo các OrderItem liên kết với order vừa tạo
    if (items && Array.isArray(items)) {
      await OrderItem.insertMany(
        items.map((item) => ({
          order_id: order._id,
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          fragile: item.fragile || false,
        }))
      );
    }

    return res.status(201).json({
      success: true,
      message: "✅ Tạo đơn hàng thành công!",
      order,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo đơn hàng",
      error: (error as Error).message,
    });
  }
};

//  Lấy danh sách đơn hàng của người dùng
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found in token" });
    }

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer_id: userId })
      .select("orderCode status total_price phone delivery_address pickup_address scheduled_time createdAt customer_id")
      .populate("vehicle_id", "type")
      .populate("carrier_id", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); 


    const totalOrders = await Order.countDocuments({ customer_id: userId });
    // 🟢 Chuẩn hóa field để luôn có orderCode
    for (const o of orders) {
      o.orderCode = o.orderCode || o.code || o.order_code || "";
    }

    res.status(200).json({
      success: true,
      total: totalOrders,
      page,
      pages: Math.ceil(totalOrders / limit),
      orders, // ✅ FE dùng orderApi.listMyOrders().orders
    });

  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};


//  Lấy chi tiết đơn hàng theo ID
// 🟢 Lấy chi tiết đơn hàng cho khách (giống carrier)
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("orderCode status total_price phone delivery_address pickup_address scheduled_time createdAt customer_id")
      .populate("carrier_id vehicle_id customer_id")
      .lean(); // 🟩 Quan trọng — để dữ liệu thành plain object

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items, trackings] = await Promise.all([
      OrderItem.find({ order_id: order._id }).lean(),
      OrderTracking.find({ order_id: order._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const goods = (items || []).map((it) => ({
      id: String(it._id),
      description: it.description ?? "",
      quantity: Number(it.quantity ?? 0),
      weight: it?.weight?.$numberDecimal
        ? Number(it.weight.$numberDecimal)
        : typeof it?.weight === "object" && it?.weight?._bsontype === "Decimal128"
          ? Number(it.weight.toString())
          : Number(it?.weight ?? 0),
      fragile: !!it.fragile,
    }));

    // 🟩 Đảm bảo trả về orderCode
    res.json({
      success: true,
      ...order,
      goods,
      trackings,
    });

  } catch (error) {
    console.error("❌ getOrderById error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order deleted successfully",
      order,
    });
  } catch (error) {
    console.error("deleteOrder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const searchOrder = async (req: Request, res: Response) => {
  try {
    const { id, phone } = req.query;

    if (!id && !phone) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng hoặc số điện thoại.",
      });
    }

    let orders = [];

    // 🔹 Nếu tìm theo số điện thoại
    if (phone) {
      orders = await Order.find({ phone }).sort({ createdAt: -1 });
    }

    // 🔹 Nếu tìm theo mã đơn hàng
    else if (id) {
      const orderId = id as string;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Mã đơn hàng không hợp lệ.",
        });
      }

      const foundOrder = await Order.findById(orderId);
      if (foundOrder) orders = [foundOrder];
    }

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng nào.",
      });
    }

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (err: any) {
    console.error("❌ Lỗi server khi tìm đơn hàng:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm đơn hàng",
      error: err.message, // thêm để debug nhanh
    });
  }
};
// ✅ Không xoá order, chỉ cập nhật trạng thái
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id; //  Lấy từ middleware requireAuth

    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng vì trạng thái hiện tại là "${order.status}".`,
      });
    }

    // ✅ Cập nhật trạng thái
    order.status = "CANCELLED"; // hoặc "CANCELLED" nếu bạn dùng enum in hoa
    await order.save();

    // ✅ Ghi lại log trạng thái
    await OrderStatusLog.create({
      order_id: order._id,
      updated_by: userId,
      status: "CANCELLED",
      note: reason || "Người dùng hủy đơn hàng",
    });

    return res.json({ success: true, message: "Đơn hàng đã được cập nhật trạng thái hủy." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server khi hủy đơn hàng." });
  }
};



export const getOrderItemsByOrderId = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const items = await OrderItem.find({ order_id: orderId });
    res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("Lỗi khi lấy order items:", error);
    res.status(500).json({ success: false, message: "Không thể lấy danh sách hàng hóa" });
  }
};
export const updateOrderPackage = async (req, res) => {
  try {
    const { id } = req.params; // orderId
    const { new_package_id } = req.body;

    if (!new_package_id) {
      return res.status(400).json({ success: false, message: "Thiếu gói mới." });
    }

    // 1️⃣ Lấy đơn hàng hiện tại
    const order = await Order.findById(id).populate("extra_fees");
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    }

    const pickup_address = order.pickup_address;
    const delivery_address = order.delivery_address;

    // 2️⃣ Gọi API tính giá vận chuyển mới theo gói mới
    const axios = require("axios");
    const pricingRes = await axios.post("http://localhost:4000/api/pricing/estimate2", {
      pickup_address,
      delivery_address,
      pricepackage_id: new_package_id,
    });

    if (!pricingRes.data?.success) {
      return res.status(400).json({ success: false, message: "Không tính được giá với gói mới." });
    }

    const { totalFee, distance, duration } = pricingRes.data.data;

    // 3️⃣ Tính thêm tổng phí phụ (extra_fees)
    const extraFeeTotal = Array.isArray(order.extra_fees)
      ? order.extra_fees.reduce(
          (sum, fee) => sum + Number(fee.price || 0),
          0
        )
      : 0;

    const finalTotal = totalFee + extraFeeTotal;

    // 4️⃣ Cập nhật đơn hàng
    order.package_id = new_package_id;
    order.total_price = finalTotal;
    order.distance = distance?.text || order.distance;
    order.duration = duration?.text || order.duration;
    await order.save();

    // 5️⃣ Trả kết quả về frontend
    return res.json({
      success: true,
      message: "✅ Đã cập nhật gói và tính lại giá (bao gồm phụ phí).",
      data: {
        total_price: finalTotal,
        base_fee: totalFee,
        extra_fee: extraFeeTotal,
        distance: distance?.text,
        duration: duration?.text,
      },
    });
  } catch (err) {
    console.error("updateOrderPackage error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server khi cập nhật gói." });
  }
};
export const addOrderImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin ảnh.",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    // Thêm ảnh vào order (tạo field mới nếu chưa có)
    if (!order.images) {
      order.images = [];
    }

    order.images = [...order.images, ...images];
    await order.save();

    return res.json({
      success: true,
      message: "Đã thêm ảnh vào đơn hàng!",
      order,
    });
  } catch (err) {
    console.error("❌ Lỗi khi thêm ảnh:", err);
    res.status(500).json({
      success: false,
      message: "Không thể thêm ảnh vào đơn hàng.",
    });
  }
};
