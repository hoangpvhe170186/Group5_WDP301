import { Request, Response } from "express";
import Order from "../models/Order"; // đảm bảo đã có model Order.ts

// 🟢 Tạo đơn hàng mới
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      seller_id,
      carrier_id,
      driver_id,
      vehicle_id,
      package_id,
      phone,
      pickup_address,
      delivery_address,
      scheduled_time,
      total_price
    } = req.body;

    const order = await Order.create({
      customer_id,
      seller_id,
      carrier_id,
      driver_id,
      vehicle_id,
      phone,
      package_id,
      pickup_address,
      delivery_address,
      scheduled_time,
      total_price,
      status: "Pending"
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Server error", error });
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
    const { phone, id } = req.query;

    if (!phone && !id)
      return res.status(400).json({ success: false, message: "Cần nhập số điện thoại hoặc mã đơn hàng!" });

    if (id) {
      const order = await Order.findById(id)
        .populate("pricepackage_id", "name base_price workers max_floor wait_time")
        .lean();
      if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
      return res.json({ success: true, orders: [order] }); // luôn trả mảng để FE đồng nhất
    }

    const orders = await Order.find({ phone })
      .sort({ createdAt: -1 })
      .populate("pricepackage_id", "name base_price workers max_floor wait_time")
      .lean();

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng nào!" });
    }

    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ Lỗi khi tìm đơn hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi tìm đơn hàng" });
  }
};