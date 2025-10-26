import { Request, Response } from "express";
import User from "../models/User";
import Order from "../models/Order";
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
      .populate("driver_id")
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
    const drivers = await User.find({ role: "Driver", status: "Active" }).select(
      "_id full_name email phone"
    );

    res.status(200).json({
      success: true,
      data: drivers,
      total: drivers.length,
    });
  } catch (error) {
    console.error("Error getting drivers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách driver",
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
    const { driver_id, carrier_id } = req.body;

    if (!driver_id || !carrier_id) {
      return res.status(400).json({ success: false, message: "Thiếu driver_id hoặc carrier_id" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        driver_id,
        carrier_id,
        status: "Assigned", // ✅ CHỈ ĐÁNH DẤU ĐÃ GIAO VIỆC
      },
      { new: true }
    ).populate("driver_id carrier_id");

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
      .populate("driver_id")
      .populate("customer_id");  
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { driver_id, scheduled_time } = req.body;

    const updateData: any = {};
    if (driver_id) updateData.driver_id = driver_id;
    if (scheduled_time) updateData.scheduled_time = scheduled_time;

    // Nếu bạn muốn ghi log khi driver được chỉ định
    if (driver_id) {
      updateData.$push = {
        auditLogs: {
          at: new Date(),
          by: req.user?.id || "system",
          action: "ASSIGNED_DRIVER",
          note: `Chỉ định driver ${driver_id}`,
        },
      };
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
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi cập nhật đơn hàng" });
  }
};

export const getDriverSchedule = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    // Lấy tất cả orders có driver_id và scheduled_time trong 7 ngày tới
    const orders = await Order.find({
      driver_id: { $ne: null },
      scheduled_time: { $gte: today, $lte: nextWeek }
    }).populate("driver_id", "full_name");
    
    const scheduleMap: Record<string, any[]> = {};
    
    for (const order of orders) {
      const driver = order.driver_id?.full_name || "Chưa rõ";
      const date = new Date(order.scheduled_time).toISOString().slice(0, 10);
      if (!scheduleMap[date]) scheduleMap[date] = [];
      scheduleMap[date].push(driver);
    }
    
    res.status(200).json({ success: true, data: scheduleMap });
  } catch (err) {
    console.error("❌ Lỗi khi lấy lịch driver:", err);
    res.status(500).json({ success: false, message: "Không thể tải lịch tài xế!" });
  }
};
export const confirmOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Chỉ đơn ở trạng thái Pending mới được xác nhận" });
    }

    order.status = "Confirmed";
    await order.save();

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


// phan trang 

export const getPaginationAllOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate("seller_id")
        .populate("package_id")
        .populate("driver_id")
        .populate("customer_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng nào" });
    }

    res.json({
      success: true,
      data: orders,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};

// -----------------------------

export const getPaginationDrivers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [drivers, total] = await Promise.all([
      User.find({ role: "Driver", status: "Active" })
        .select("_id full_name email phone")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Driver", status: "Active" }),
    ]);

    res.status(200).json({
      success: true,
      data: drivers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting drivers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách driver",
    });
  }
};



export const getPaginationSellers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      User.find({ role: "Seller", status: "Active" })
        .select("_id full_name email phone")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Seller", status: "Active" }),
    ]);

    res.status(200).json({
      success: true,
      data: sellers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting sellers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách seller",
    });
  }
};

export const getPaginationCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      User.find({ role: "Customer", status: "Active" })
        .select("_id full_name email phone")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Customer", status: "Active" }),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting customers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách customer",
    });
  }
};


