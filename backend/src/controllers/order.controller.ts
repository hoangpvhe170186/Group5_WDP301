import { Request, Response } from "express";
import Order from "../models/Order"; // đảm bảo đã có model Order.ts
import OrderItem from "../models/OrderItem";
import PricePackage from "../models/PricePackage";
import mongoose from "mongoose";
import OrderStatusLog from "../models/OrderStatusLog";

export const createTemporaryOrder = async (req, res) => {
  try {
    const {
      customer_id,
      phone,
      package_id,
      pickup_address,
      delivery_address,
      total_price,
      extra_fees = []
    } = req.body;

    if (!customer_id || !phone || !package_id || !pickup_address || !delivery_address) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin đơn hàng." });
    }

    // ✅ Lấy chi tiết extraFee từ DB để tránh dữ liệu frontend fake
    let extraFeeIds: string[] = [];
    let extraFeeTotal = 0;

    if (Array.isArray(extra_fees) && extra_fees.length > 0) {
      extraFeeIds = extra_fees.map((f) => f.id);
      extraFeeTotal = extra_fees.reduce(
        (sum, f) => sum + Number(f.price || 0),
        0
      );
    }

    const finalPrice = Number(total_price) + extraFeeTotal;

    const order = await Order.create({
      customer_id,
      phone,
      package_id,
      pickup_address,
      delivery_address,
      status: "Pending",
      total_price: finalPrice,
      extra_fees: extra_fees.filter((x) => x) // ✅ Lưu danh sách ID phụ phí
    });

    res.json({ success: true, message: "Tạo đơn hàng thành công ✅", order });
  } catch (err) {
    console.error("❌ Lỗi khi tạo đơn hàng:", err);
    res.status(500).json({ success: false, message: "Không thể tạo đơn hàng." });
  }
};
// ✅ Thêm chi tiết hàng hóa (OrderItem)
export const addOrderItems = async (req, res) => {
  try {
    const { order_id, items, delivery_schedule, extra_fees } = req.body;

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin chi tiết hàng hóa.",
      });
    }

    // ✅ Tìm đơn hàng
    const order = await Order.findById(order_id).populate("package_id");
    if (!order)
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    // ✅ Validate Extra Fee IDs (nếu có)
    if (extra_fees && Array.isArray(extra_fees)) {
      const validExtraFees = extra_fees.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      order.extra_fees = validExtraFees;
    }

    // ✅ Kiểm tra khối lượng
    const maxCapacity = Number(order.package_id?.capacity || 0);
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);

    // ✅ Validate
    if (maxCapacity && totalWeight > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Tổng khối lượng ${totalWeight}kg vượt quá giới hạn ${maxCapacity}kg của gói.`,
      });
    }

    // ✅ Lưu sản phẩm
    await OrderItem.insertMany(
      items.map((item) => ({
        order_id,
        description: item.description,
        quantity: item.quantity,
        weight: item.weight,
        fragile: item.fragile || false,
        type: item.type || [],
        shipping_instructions: item.shipping_instructions || [],
        driver_note: item.driver_note || "",
      }))
    );

    // ✅ Lưu thời gian giao hàng
    if (delivery_schedule) {
      const { type, datetime } = delivery_schedule;

      if (type === "later" && datetime) {
        order.scheduled_time = new Date(datetime);
      } else {
        order.scheduled_time = new Date(Date.now() + 2 * 60 * 60 * 1000);
      }
    }

    // ✅ Cập nhật trạng thái + LƯU lại đơn hàng
    order.status = "Pending";
    await order.save();

    res.json({
      success: true,
      message: "Đã thêm hàng hóa + phụ phí + lịch giao hàng!",
      order,
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
      total_price,
      pricepackage_id,
      phone,
      items // 👈 nếu frontend gửi danh sách sản phẩm
    } = req.body;

    // 1️ Tạo đơn hàng
    const order = await Order.create({
      customer_id,
      pickup_address,
      delivery_address,
      total_price,
      pricepackage_id,
      phone,
    });

    //  Tạo các OrderItem liên kết với order vừa tạo
    if (items && Array.isArray(items)) {
      await OrderItem.insertMany(
        items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          fragile: item.fragile || false,
          type: item.type || [],
          shipping_instructions: item.shipping_instructions || [],
          driver_note: item.driver_note || "",
        }))
      );
    }

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      order,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo đơn:", error);
    return res.status(500).json({ success: false, message: "Không thể tạo đơn hàng" });
  }
};

//  Lấy danh sách đơn hàng của người dùng
export const getMyOrders = async (req: Request, res: Response) => {
  try {

    const userId = req.user?.id;
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not found in token" });
    }

    //  Hỗ trợ phân trang và giới hạn dữ liệu
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    
    const orders = await Order.find({ customer_id: userId })
      .populate("vehicle_id", "type") 
      .populate("carrier_id", "name phone")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    
    const totalOrders = await Order.countDocuments({ customer_id: userId });

    return res.status(200).json({
      success: true,
      total: totalOrders,
      page,
      pages: Math.ceil(totalOrders / limit),
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

//  Lấy chi tiết đơn hàng theo ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate("carrier_id vehicle_id");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
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
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng vì trạng thái hiện tại là "${order.status}".`,
      });
    }

    await OrderStatusLog.create({
      order_id: order._id,
      updated_by: userId,
      status: "Canceled",
      note: reason || "Người dùng hủy đơn hàng",
    });

    await Order.deleteOne({ _id: order._id });

    return res.json({ success: true, message: "Đã hủy và xóa đơn hàng thành công." });
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

