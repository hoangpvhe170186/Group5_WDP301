import { Request, Response } from "express";
import Order from "../models/Order"; // đảm bảo đã có model Order.ts
import OrderItem from "../models/OrderItem";
import PricePackage from "../models/PricePackage";
import mongoose from "mongoose";
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

    const pkg = await PricePackage.findById(package_id);
    if (!pkg) return res.status(404).json({ success: false, message: "Không tìm thấy gói giá." });

    const order = await Order.create({
      customer_id,
      phone,
      package_id,
      pickup_address,
      delivery_address,
      total_price,
      status: "Pending",
    });

    res.json({ success: true, message: "Tạo đơn hàng tạm thành công", order });
  } catch (err) {
    console.error("❌ Lỗi khi tạo đơn hàng tạm:", err);
    res.status(500).json({ success: false, message: "Không thể tạo đơn hàng tạm." });
  }
};


// ✅ Thêm chi tiết hàng hóa (OrderItem)
export const addOrderItems = async (req, res) => {
  try {
    const { order_id, items } = req.body;

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin chi tiết hàng hóa." });
    }

    // Kiểm tra đơn có tồn tại không
    const order = await Order.findById(order_id).populate("package_id");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    // ✅ Kiểm tra tổng khối lượng không vượt quá capacity của gói
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const maxCapacity = Number(order.package_id?.vehicle?.capacity || 0);

    if (maxCapacity && totalWeight > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Tổng khối lượng ${totalWeight}kg vượt quá giới hạn ${maxCapacity}kg của gói.`,
      });
    }

    // ✅ Lưu danh sách hàng hóa
    const insertedItems = await OrderItem.insertMany(
      items.map((item) => ({
        ...item,
        order_id,
      }))
    );

    // ✅ Cập nhật trạng thái đơn hàng thành "Confirmed"
    order.status = "Confirmed";
    await order.save();

    res.json({
      success: true,
      message: "Đã xác nhận và thêm chi tiết hàng hóa thành công.",
      items: insertedItems,
    });
  } catch (err) {
    console.error("❌ Lỗi khi thêm hàng hóa:", err);
    res.status(500).json({ success: false, message: "Không thể thêm chi tiết hàng hóa." });
  }
};
// 🟢 Tạo đơn hàng mới
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

    // 1️⃣ Tạo đơn hàng
    const order = await Order.create({
      customer_id,
      pickup_address,
      delivery_address,
      total_price,
      pricepackage_id,
      phone,
    });

    // 2️⃣ Tạo các OrderItem liên kết với order vừa tạo
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
      message: "Tạo đơn hàng thành công",
      order,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo đơn:", error);
    return res.status(500).json({ success: false, message: "Không thể tạo đơn hàng" });
  }
};

// 🟡 Lấy danh sách đơn hàng của người dùng
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id; // nếu dùng JWT
    const orders = await Order.find({ customer_id: userId }).populate("vehicle_id carrier_id");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 🔵 Lấy chi tiết đơn hàng theo ID
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
