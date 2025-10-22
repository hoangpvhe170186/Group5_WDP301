import { Request, Response } from "express";
import PricePackage from "../models/PricePackage";
import PricePerKm from "../models/PricePerKm";
import { getDistanceMatrix } from "../utils/getDistanceMatrix";
import Vehicle from "../models/Vehicle";
import mongoose from "mongoose";

/**
 * @route   GET /api/pricing
 * @desc    Lấy danh sách tất cả các gói cước, có đính kèm thông tin xe.
 */
export const getAllPricePackages = async (req: Request, res: Response) => {
  try {
    // 🟢 Lấy toàn bộ gói giá
    const packages = await PricePackage.find({}).lean();

    // 🟢 Lấy toàn bộ xe để biết capacity + package_id
    const vehicles = await Vehicle.find({}, "capacity package_id").lean();

    // 🟢 Ghép capacity vào từng gói
    const packagesWithCapacity = packages.map((pkg) => {
      const vehicle = vehicles.find(
        (v) => v.package_id?.toString() === pkg._id.toString()
      );

      return {
        ...pkg,
        capacity: vehicle ? vehicle.capacity : null,
      };
    });

    res.status(200).json({ success: true, packages: packagesWithCapacity });
  } catch (error) {
    console.error("❌ Lỗi khi tải danh sách gói cước:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tải danh sách gói cước." });
  }
};

/**
 * @route   GET /api/pricing/details/:packageName
 * @desc    Lấy chi tiết của một gói cước.
 */
export const getPricingDetailsByName = async (req: Request, res: Response) => {
  try {
    const { packageName } = req.params;
    const pkg = await PricePackage.findOne({ name: packageName })
      .populate({
        path: 'vehicle',
        select: 'name capacity image'
      })
      .lean();

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói cước" });
    }

    const tiers = await PricePerKm.find({ package_id: pkg._id }).sort({ min_km: 1 }).lean();
    res.status(200).json({ success: true, package: pkg, tiers });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết gói cước:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy chi tiết gói cước." });
  }
};

/**
 * @route   POST /api/pricing/calc
 * @desc    Tính toán chi phí.
 */
export const calcPrice = async (req: Request, res: Response) => {
  try {
    const { packageId, distanceKm } = req.body;

    // Chặn số âm ngay từ đầu
    if (!packageId || typeof distanceKm !== "number" || distanceKm < 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ hoặc khoảng cách là số âm." });
    }

    const pkg = await PricePackage.findById(packageId).lean();
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói cước." });
    }

    const tiers = await PricePerKm.find({ package_id: pkg._id }).sort({ min_km: 1 }).lean();

    const matched = tiers.find(t => {
      if (t.max_km == null) return distanceKm >= t.min_km;
      return distanceKm >= t.min_km && distanceKm <= t.max_km;
    });

    if (!matched) {
      return res.status(400).json({ success: false, message: "Khoảng cách không nằm trong bất kỳ mức giá nào." });
    }

    const basePrice = Number(pkg.base_price.toString());
    const perKmPrice = Number(matched.price.toString());
    const totalFee = Math.round(basePrice + (distanceKm * perKmPrice));

    res.json({
      success: true,
      data: {
        package: { id: pkg._id, name: pkg.name, base_price: basePrice },
        distanceKm,
        matchedTier: matched,
        totalFee,
      },
    });
  } catch (err) {
    console.error("Lỗi khi tính giá:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi tính giá." });
  }
};
/**
 * @route   POST /api/pricing/estimate
 * @desc    Tính giá tự động từ địa chỉ pickup/dropoff + package (id hoặc name)
 * @body    { pickup_address, delivery_address, packageId?, packageName? }
 */
export const estimatePriceByAddress = async (req: Request, res: Response) => {
  try {
    const { pickup_address, delivery_address, vehicle_id } = req.body || {};

    // 1️⃣ Kiểm tra dữ liệu đầu vào
    if (!pickup_address || !delivery_address) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu địa chỉ lấy/giao." });
    }
    if (!vehicle_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu vehicle_id." });
    }

    // 2️⃣ Tìm xe và populate gói cước
    const vehicle = (await Vehicle.findById(vehicle_id)
      .populate("package_id")
      .lean()) as any;
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe." });
    }

    // 3️⃣ Lấy gói cước đã populate (ép kiểu rõ ràng để TypeScript hiểu)
    const pkg = vehicle.package_id as {
      _id: string;
      name: string;
      base_price: number | mongoose.Types.Decimal128;
    };

    if (!pkg) {
      return res
        .status(404)
        .json({ success: false, message: "Xe chưa được gán gói cước." });
    }

    // 4️⃣ Gọi Google/Mapbox API để tính khoảng cách & thời gian
    const { distanceKm, durationMin, text } = await getDistanceMatrix(
      pickup_address,
      delivery_address
    );

    // 5️⃣ Lấy danh sách mức giá theo km cho gói này
    const tiers = await PricePerKm.find({ package_id: pkg._id })
      .sort({ min_km: 1 })
      .lean();

    // Chọn mức giá phù hợp
    const matched = tiers.find((t) => {
      if (t.max_km == null) return distanceKm >= t.min_km;
      return distanceKm >= t.min_km && distanceKm <= t.max_km;
    });

    if (!matched) {
      return res.status(400).json({
        success: false,
        message: "Khoảng cách không nằm trong bất kỳ mức giá nào.",
      });
    }

    // 6️⃣ Tính tổng phí
    const basePrice = Number(pkg.base_price);
    const perKmPrice = Number(matched.price);
    const totalFee = Math.round(basePrice + distanceKm * perKmPrice);

    // 7️⃣ Trả kết quả
    return res.json({
      success: true,
      data: {
        vehicle: {
          id: vehicle._id,
          plate_number: vehicle.plate_number,
          capacity: vehicle.capacity,
        },
        package: {
          id: pkg._id,
          name: pkg.name,
          base_price: basePrice,
        },
        distance: { km: distanceKm, text: text.distance },
        duration: { minutes: durationMin, text: text.duration },
        matchedTier: matched,
        perKmPrice,
        totalFee,
      },
    });
  } catch (error: any) {
    console.error("❌ estimatePriceByAddress error:", error); // in toàn bộ object
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tính giá tự động.",
    });
  }
};

export const estimatePriceByAddress2 = async (req: Request, res: Response) => {
  try {
    const { pickup_address, delivery_address, pricepackage_id } = req.body || {};

    // 1) Validate input
    if (!pickup_address || !delivery_address) {
      return res.status(400).json({ success: false, message: "Thiếu địa chỉ lấy/giao." });
    }
    if (!pricepackage_id) {
      return res.status(400).json({ success: false, message: "Thiếu pricepackage_id." });
    }

    // 2) Tìm gói cước
    const pkg = await PricePackage.findById(pricepackage_id).lean();
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói giá." });
    }

    // 3) Gọi Map (bắt lỗi riêng để trả 502 thay vì 500 mù)
    let dist: {
      distanceKm: number;
      durationMin: number;
      text?: { distance?: string; duration?: string };
      geometry?: any;
    };
    try {
      dist = await getDistanceMatrix(pickup_address, delivery_address);
      if (dist == null || typeof dist.distanceKm !== "number") {
        throw new Error("distanceKm undefined");
      }
    } catch (e: any) {
      console.error("❌ getDistanceMatrix error:", e?.response?.data || e?.message || e);
      return res
        .status(502)
        .json({ success: false, message: "Không tính được quãng đường (dịch vụ bản đồ)." });
    }

    // 4) Lấy bảng giá theo km cho gói
    const tiers = await PricePerKm.find({ package_id: pkg._id }).sort({ min_km: 1 }).lean();
    if (!tiers?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Gói giá chưa cấu hình bảng giá theo km." });
    }

    // 5) Chọn tier phù hợp
    const km = Number(dist.distanceKm);
    const matched = tiers.find((t) => {
      const min = Number(t.min_km ?? 0);
      const max = t.max_km == null ? null : Number(t.max_km);
      return max == null ? km >= min : km >= min && km <= max;
    });
    if (!matched) {
      return res
        .status(400)
        .json({ success: false, message: "Khoảng cách không nằm trong bất kỳ mức giá nào." });
    }

    // 6) Tính tiền
    const basePrice = Number((pkg as any).base_price ?? 0);
    const perKmPrice = Number((matched as any).price ?? 0);
    const totalFee = Math.round(basePrice + km * perKmPrice);

    // 7) Trả kết quả
    return res.status(200).json({
      success: true,
      data: {
        package: { id: (pkg as any)._id, name: (pkg as any).name, base_price: basePrice },
        distance: { km, text: dist.text?.distance },
        duration: { minutes: dist.durationMin, text: dist.text?.duration },
        matchedTier: matched,
        perKmPrice,
        totalFee,
        geometry: dist.geometry ?? null,
      },
    });
  } catch (error: any) {
    console.error("❌ estimatePriceByAddress2 error:", error?.stack || error);
    return res.status(500).json({ success: false, message: "Không thể tính giá tự động." });
  }
};