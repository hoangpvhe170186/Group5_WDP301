import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Order from "../models/Order";
import Feedback from "../models/Feedback";
import Incident from "../models/Incident";
import OrderItem from "../models/OrderItem";
import OrderStatusLog from "../models/OrderStatusLog";

export const getCurrentUser = async (req: any, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user._id).select("-password_hash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin người dùng",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select("-password_hash");
    res.status(200).json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách users"
    });
  }
};
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password_hash");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user"
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin user"
    });
  }
};
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Không cho phép cập nhật password_hash qua API này
    const { password_hash, ...updateFields } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields, updatedAt: new Date() },
      { new: true, runValidators: true, select: "-password_hash" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: "Cập nhật thông tin user thành công"
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin user"
    });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req : Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ message: "Đã xóa user thành công" });
  } catch {
    res.status(500).json({ error: "Không thể xóa user" });
  }
};

export const updateUserStatus = async (req : Request, res: Response) => {
  const { status } = req.body;
  if (!Object.values(status).includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(user);
};


export const searchUsers = async (req : Request, res : Response) => {
  const { role, status, q } = req.query;
  const query: any = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (q) query.full_name = { $regex: q, $options: "i" };

  const users = await User.find(query).limit(50).select("-password_hash");
  res.json(users);
};


export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("seller_id")
      .populate("package_id")
      .populate("carrier_id")
      .populate("customer_id")
      .sort({ createdAt: -1 }); // ✅ Sắp xếp từ sớm nhất → muộn nhất

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng nào" });
    }

    res.json(orders);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const carriers = await User.find({ role: "Carrier", status: "Active" }).select(
      "_id full_name email phone"
    );

    res.status(200).json({
      success: true,
      data: carriers,
      total: carriers.length,
    });
  } catch (error) {
    console.error("Error getting carriers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách carrier",
    });
  }
};

export const getCarriers = async (req: Request, res: Response) => {
  try {
    const carriers = await User.find({ role: "Carrier", status: "Active" }).select(
      "_id full_name email phone"
    );

    res.status(200).json({
      success: true,
      data: carriers,
      total: carriers.length,
    });
  } catch (error) {
    console.error("Error getting carriers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách carrier",
    });
  }
};

export const getSellers = async (req: Request, res: Response) => {
  try {
    const carriers = await User.find({ role: "Seller", status: "Active" }).select(
      "_id full_name email phone"
    );

    res.status(200).json({
      success: true,
      data: carriers,
      total: carriers.length,
    });
  } catch (error) {
    console.error("Error getting carriers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách carrier",
    });
  }
};

export const assignOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {  carrier_id } = req.body;

    if ( !carrier_id) {
      return res.status(400).json({ success: false, message: "Thiếu d carrier_id" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        carrier_id,
        status: "Assigned", // ✅ CHỈ ĐÁNH DẤU ĐÃ GIAO VIỆC
      },
      { new: true }
    ).populate("carrier_id");

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json({
      success: true,
      message: "✅ Giao việc thành công!",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Lỗi khi giao việc:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi giao việc" });
  }
};


export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("seller_id")
      .populate("package_id")
      .populate("carrier_id")
      .populate("customer_id");  
    if (!order) return res.status(404).json({ message: "Order not found" });
    const orderItems = await OrderItem.find({ order_id: req.params.id });

    res.json({ data: { ...order.toObject(), items: orderItems } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { carrier_id, scheduled_time } = req.body;

    const updateData: any = {};

    if (carrier_id) {
      updateData.carrier_id = carrier_id;
      updateData.assignedCarrier = carrier_id; // 🟩 Thêm dòng này để Carrier thấy đơn

      // ✅ Ghi log khi chỉ định carrier mới
      updateData.$push = {
        auditLogs: {
          at: new Date(),
          by: req.user?.id || "system",
          action: "ASSIGNED_CARRIER",
          note: `Chỉ định carrier ${carrier_id}`,
        },
      };

      // ✅ Đồng thời chuyển trạng thái sang ASSIGNED nếu chưa có carrier
      updateData.status = "ASSIGNED";
    }

    if (scheduled_time) {
      updateData.scheduled_time = scheduled_time;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật đơn hàng",
    });
  }
};
export const getDriverSchedule = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    // Lấy tất cả orders có carrier_id và scheduled_time trong 7 ngày tới
    const orders = await Order.find({
      carrier_id: { $ne: null },
      scheduled_time: { $gte: today, $lte: nextWeek }
    }).populate("carrier_id", "full_name");
    
    const scheduleMap: Record<string, any[]> = {};
    
    for (const order of orders) {
      const carrier = order.carrier_id?.full_name || "Chưa rõ";
      const date = new Date(order.scheduled_time).toISOString().slice(0, 10);
      if (!scheduleMap[date]) scheduleMap[date] = [];
      scheduleMap[date].push(carrier);
    }
    
    res.status(200).json({ success: true, data: scheduleMap });
  } catch (err) {
    console.error("❌ Lỗi khi lấy lịch carrier:", err);
    res.status(500).json({ success: false, message: "Không thể tải lịch tài xế!" });
  }
};
export const confirmOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?._id || (req as any).user?.id;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Chỉ đơn ở trạng thái Pending mới được xác nhận" });
    }

    order.status = "CONFIRMED";
    await order.save();

    // ✅ Tạo OrderStatusLog để ghi lại thời điểm chuyển sang CONFIRMED
    await OrderStatusLog.create({
      order_id: order._id,
      updated_by: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      status: "CONFIRMED", // OrderStatusLog dùng "Confirmed" (chữ C hoa, còn lại thường)
      note: "Đơn hàng đã được xác nhận từ Pending"
    });

    res.status(200).json({
      success: true,
      message: "✅ Đơn hàng đã được xác nhận (Pending → Confirmed)",
      data: order
    });
  } catch (err) {
    console.error("❌ Lỗi khi xác nhận đơn:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận đơn"
    });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?._id || (req as any).user?.id;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Chỉ đơn ở trạng thái Pending mới được xác nhận" });
    }

    order.status = "CANCELLED";
    await order.save();

    // ✅ Tạo OrderStatusLog để ghi lại thời điểm chuyển sang CONFIRMED
    await OrderStatusLog.create({
      order_id: order._id,
      updated_by: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      status: "CANCELLED", // OrderStatusLog dùng "Confirmed" (chữ C hoa, còn lại thường)
      note: "Đơn hàng đã được xác nhận từ Pending"
    });

    res.status(200).json({
      success: true,
      message: "✅ Đơn hàng đã được xác nhận (Pending → Confirmed)",
      data: order
    });
  } catch (err) {
    console.error("❌ Lỗi khi xác nhận đơn:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận đơn"
    });
  }
};

// 🟧 Seller nhận đơn: chỉ nhận đơn đang Pending và chưa có seller_id
export const claimSellerOrder = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user?.id;
    const orderId = req.params.id;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập" });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: "Pending", seller_id: null },
      {
        $set: {
          seller_id: sellerId,
          // status intentionally unchanged to follow user's preference
        },
        $push: {
          auditLogs: {
            at: new Date(),
            by: sellerId,
            action: "SELLER_CLAIM",
            note: "Seller đã nhận đơn",
          },
        },
      },
      { new: true }
    )
      .populate("seller_id", "_id full_name");

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Đơn đã được seller khác nhận hoặc không còn ở trạng thái Pending",
      });
    }

    const io = (req as any).io;
    if (io) {
      io.to("seller:all").emit("order:seller_claimed", {
        orderId: String(updated._id),
        sellerId: String(sellerId),
      });
    }

    return res.status(200).json({ success: true, message: "Nhận đơn thành công", data: updated });
  } catch (err: any) {
    console.error("❌ Seller claim order failed:", err);
    return res.status(500).json({ success: false, message: err.message || "Lỗi server" });
  }
};


export const getOrdersByCustomer = async (req: Request, res: Response) => {
  try {
    const { customer_id } = req.params; // 🔹 Lấy id từ URL, ví dụ /orders/customer/:customer_id

    const orders = await Order.find({
      customer_id, 
      status: { $in: ["CANCELLED", "COMPLETED"] } // 🔍 Chỉ lấy đơn có status trong 2 loại này
    })
      .populate("seller_id")
      .populate("carrier_id")
      .populate("package_id")
      .populate("carrier_id")
      .populate("customer_id")
      .sort({ createdAt: -1 }); // 🕒 Mới nhất lên đầu

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng nào" });
    }

    res.json(orders);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};
export const RatingOrders = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.status(200).json(feedback);
  } catch (error) {
    console.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi rate cho đơn hàng"
    });
  }
};
export const getFeedbackByOrderId = async (req: Request, res: Response) => {
  try {
    const fb = await Feedback.findOne({ order_id: req.params.order_id });
    res.json(fb);
  } catch (error) {
    console.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy feedback by order ID"
    });
  }
};
export const reportIncident = async (req: Request, res: Response) => {
  try {
    const incident = new Incident(req.body);
    await incident.save();
    res.status(201).json({ message: "Báo cáo sự cố thành công", incident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi gửi báo cáo", error: err });
  }
};
export const getIcidentByOrderId = async (req: Request, res: Response) => {
  try {
    const incidents = await Incident.find({ order_id: req.params.order_id });
   
    if (!incidents || incidents.length === 0) return res.status(404).json({ message: "Incident not found" });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getAllIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await Incident.find().populate("reported_by").populate("order_id").sort({ createdAt: -1 });
   
    if (!incidents || incidents.length === 0) return res.status(404).json({ message: "Incident not found" });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const resolveIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, staffId, status } = req.body; 
    // status ở đây sẽ là "Resolved" hoặc "Rejected"

    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Không tìm thấy khiếu nại" });

    // ✅ Cập nhật thông tin xử lý
    incident.status = status || "Resolved"; // nếu không gửi thì mặc định là Resolved
    incident.resolution = resolution;
    incident.resolved_by = staffId;
    incident.resolved_at = new Date();

    await incident.save();

    res.json({ message: `✅ Khiếu nại đã được ${incident.status === "Resolved" ? "giải quyết" : "từ chối"}`, incident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật khiếu nại" });
  }
};
export const getCompletedAndCancelledOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({
      status: { $in: ["COMPLETED", "CANCELLED"] },
    })
      .populate("customer_id seller_id carrier_id carrier_id")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Lỗi tải lịch sử đơn:", err);
    res.status(500).json({ message: "Lỗi server khi lấy lịch sử đơn" });
  }
};
