// controllers/vehicle.controller.ts

import Vehicle from "../models/Vehicle";
import { Request, Response } from "express";

// ... các hàm controller khác ...

export const getVehicleNavigationList = async (req: Request, res: Response) => {
  try {
    // Lấy ra các loại xe chính, sắp xếp theo tải trọng tăng dần
    const vehicles = await Vehicle.find({
      capacity: { $in: [500, 1500, 3000] }
    }).sort({ capacity: 'asc' }).select('_id capacity').lean();
    
    // Tạo một map để đảm bảo mỗi capacity chỉ có 1 xe đại diện
    const uniqueVehicles = new Map();
    vehicles.forEach(v => {
      if (!uniqueVehicles.has(v.capacity)) {
        uniqueVehicles.set(v.capacity, v);
      }
    });

    res.status(200).json(Array.from(uniqueVehicles.values()));
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách xe điều hướng." });
  }
};