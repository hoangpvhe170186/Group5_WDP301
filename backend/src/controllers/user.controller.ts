import { Request, Response } from "express";
import User from "../models/User";

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


