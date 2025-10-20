import { Request, Response } from "express";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem"; // 👈 Cần thiết để lưu items
import PricePackage from "../models/PricePackage";
import mongoose from "mongoose";

const convertToVietnamTime = (isoString: string): Date => {
  const utcDate = new Date(isoString);
  const vnOffsetMs = 7 * 60 * 60 * 1000; // GMT+7
  return new Date(utcDate.getTime() + vnOffsetMs);
};

//  Hàm kiểm tra thời gian
const isPastTime = (date: Date): boolean => {
  return date.getTime() < new Date().getTime();
};

//  Tạo đơn hàng tạm (Hàm này đã ĐÚNG)
export const createTemporaryOrder = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      phone,
      package_id,
      max_floor,
      pickup_address,
      pickup_detail,
      delivery_address,
      total_price,
      delivery_schedule,
    } = req.body;

    if (!customer_id || !phone || !package_id || !pickup_address || !delivery_address) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin đơn hàng." });
    }

    const pkg = await PricePackage.findById(package_id);
    if (!pkg)
      return res.status(404).json({ success: false, message: "Không tìm thấy gói giá." });

    //  Xử lý phần thời gian giao hàng
    let schedule = { type: "now", datetime: null };
    if (delivery_schedule?.type === "later") {
      if (!delivery_schedule.datetime) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu thời gian giao hàng cụ thể." });
      }

      const chosenTime = new Date(delivery_schedule.datetime);
      if (isPastTime(chosenTime)) {
        return res
          .status(400)
          .json({ success: false, message: "Không thể chọn thời gian trong quá khứ." });
      }

      schedule = {
        type: "later",
        datetime: convertToVietnamTime(chosenTime),
      };
    }

    const order = await Order.create({
      customer_id,
      pickup_address,
      pickup_detail,
      delivery_address,
      total_price,
      package_id,
      phone,
      max_floor: max_floor || pkg.max_floor || 1,
      delivery_schedule: schedule,
      status: "pending",
    });

    res.json({ success: true, message: "Tạo đơn hàng tạm thành công", order });
  } catch (err) {
    console.error(" Lỗi khi tạo đơn hàng tạm:", err);
    res.status(500).json({ success: false, message: "Không thể tạo đơn hàng tạm." });
  }
};

//  Thêm chi tiết hàng hóa (✅ ĐÃ SỬA LỖI Ở ĐÂY)
export const addOrderItems = async (req: Request, res: Response) => {
  try {
    const { order_id, items, delivery_schedule } = req.body;

    const order = await Order.findById(order_id);
    if (!order)
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    //  Cập nhật lại thời gian giao hàng nếu có (Phần này đã đúng)
    if (delivery_schedule) {
      if (delivery_schedule.type === "later") {
        const selected = new Date(delivery_schedule.datetime);
        if (isPastTime(selected)) {
          return res
            .status(400)
            .json({ success: false, message: "Thời gian giao hàng không hợp lệ (trong quá khứ)." });
        }

        order.delivery_schedule = {
          type: "later",
          datetime: convertToVietnamTime(selected),
        };
      } else {
        order.delivery_schedule = { type: "now", datetime: null };
      }
    }

    // --- 🚀 BẮT ĐẦU SỬA LỖI ---

    // 1. Xóa các OrderItem cũ (nếu có) để tránh trường hợp người dùng submit lại
    await OrderItem.deleteMany({ order_id: order._id });

    // 2. Tạo các OrderItem mới và liên kết với 'order_id'
    if (items && Array.isArray(items)) {
      const itemsToCreate = items.map((item: any) => ({
        order_id: order._id, // 👈 Liên kết với đơn hàng chính
        description: item.description,
        quantity: item.quantity,
        weight: item.weight,
        fragile: item.fragile || false,
        type: item.type || [],
        shipping_instructions: item.shipping_instructions || [],
        driver_note: item.driver_note || "",
      }));

      await OrderItem.insertMany(itemsToCreate);
    }

    // 3. Cập nhật trạng thái 'pending' cho đơn hàng chính
    order.status = "pending";
    await order.save();

    // --- 🚀 KẾT THÚC SỬA LỖI ---

    res.json({ success: true, message: "Cập nhật đơn hàng thành công!", order });
  } catch (err) {
    console.error(" Lỗi khi cập nhật đơn hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật đơn hàng." });
  }
};

//  Tạo đơn hàng mới (Hàm này đã ĐÚNG)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      pickup_address,
      delivery_address,
      total_price,
      pricepackage_id,
      phone,
      items
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
        items.map((item: any) => ({
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
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id; // nếu dùng JWT
    const orders = await Order.find({ customer_id: userId }).populate("vehicle_id carrier_id");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate("carrier_id vehicle_id");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Lấy thêm các items
    const items = await OrderItem.find({ order_id: order._id });

    // Gộp 2 kết quả và trả về
    res.json({ ...order.toObject(), items: items });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Cập nhật trạng thái (Hàm này đã ĐÚNG)
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

// Xóa đơn hàng (✅ ĐÃ CẢI THIỆN)
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // --- Thêm: Đồng thời xóa các items liên quan ---
    await OrderItem.deleteMany({ order_id: id });
    // --- Kết thúc ---

    res.status(200).json({
      message: "Order deleted successfully",
      order,
    });
  } catch (error) {
    console.error("deleteOrder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Tìm kiếm đơn hàng (Hàm này đã ĐÚNG)
// LƯU Ý: Tương tự, hàm này cũng không trả về 'items'
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

    //  Nếu tìm theo số điện thoại
    if (phone) {
      orders = await Order.find({ phone }).sort({ createdAt: -1 });
    }

    //  Nếu tìm theo mã đơn hàng
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