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
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find()
      .populate({
        path: "driver_id",
        select: "fullName phone email avatar role",
      })
      .populate({
        path: "carrier_id",
        select: "fullName phone email role",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: vehicles.length,
      vehicles: vehicles.map((v) => ({
        _id: v._id,
        plate_number: v.plate_number,
        type: v.type,
        capacity: v.capacity,
        status: v.status,
        driver: v.driver_id || null,
        image: v.image?.thumb
          ? v.image
          : {
            thumb: "https://res.cloudinary.com/demo/image/upload/v1723456789/default_vehicle.png",
          },
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Error fetching vehicles" });
  }
};
