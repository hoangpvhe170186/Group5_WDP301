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
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("carrier_id")
      .populate("vehicle_id")
      .populate("seller_id", "full_name")     // ✅ thêm dòng này
      .populate("customer_id", "full_name");  // ✅ thêm dòng này

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error });
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
        status: "In Transit", // ✅ Cập nhật trạng thái luôn
      },
      { new: true }
    ).populate("driver_id carrier_id");

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json({
      success: true,
      message: "Giao việc thành công!",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Lỗi khi giao việc:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi giao việc" });
  }
};