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
const specsByCapacity = {
  500: {
    maxPayload: "500kg",
    innerSize: "190cm x 140cm x 140cm",
    suitable: [
      "01 máy giặt (≈10kg)",
      "01 tủ lạnh mini (cao < 1m)",
      "01 tủ quần áo/tháo rời (cao < 1.5m, ngang < 1m)",
      "4–6 thùng đồ cá nhân (50×50×50cm)",
    ],
  },
  1500: {
    maxPayload: "1.5 tấn",
    innerSize: "300cm x 170cm x 170cm",
    suitable: [
      "Nội thất cỡ vừa–lớn",
      "15–25 thùng đồ",
      "Phù hợp chuyển trọ căn 1–2 phòng",
    ],
  },
  3000: {
    maxPayload: "3 tấn",
    innerSize: "420cm x 190cm x 200cm",
    suitable: [
      "Văn phòng nhỏ 3–5 người",
      "Thiết bị cồng kềnh, nhiều thùng hàng",
      "Chuyển nhà 2–3 phòng ngủ",
    ],
  },
};

/**
 * @route   GET /api/pricing
 * @desc    Lấy danh sách tất cả các gói cước, kèm thông tin xe VÀ thông số kỹ thuật.
 */
export const getAllPricePackages = async (req: Request, res: Response) => {
  try {
    const packages = await PricePackage.find({}).lean();
    const vehicles = await Vehicle.find({}, "capacity image type").lean();

    const packagesWithFullInfo = packages.map((pkg) => {
      let targetCapacity: number | null = null;
      // ✅ Bước 2: Suy ra tải trọng từ tên gói
      if (pkg.name === "Gói Nhỏ") {
        targetCapacity = 500;
      } else if (pkg.name === "Gói Chung") {
        targetCapacity = 1500;
      } else if (pkg.name === "Gói Lớn") {
        targetCapacity = 3000;
      }

      let representativeVehicle = null;
      let vehicleSpecs = null;

      if (targetCapacity !== null) {
        // ✅ Bước 3: Tìm xe đại diện VÀ thông số kỹ thuật tương ứng
        representativeVehicle = vehicles.find(v => v.capacity === targetCapacity);
        vehicleSpecs = specsByCapacity[targetCapacity as keyof typeof specsByCapacity];
      }

      // ✅ Bước 4: Trả về đối tượng đã được gộp đầy đủ thông tin
      return {
        ...pkg,
        vehicleInfo: representativeVehicle ? {
          capacity: representativeVehicle.capacity,
          type: representativeVehicle.type,
          image: representativeVehicle.image,
        } : null,
        specs: vehicleSpecs || null, // Thêm thông số kỹ thuật vào đây
      };
    });

    res.status(200).json({ success: true, packages: packagesWithFullInfo });

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

    if (pickup_address.trim() === delivery_address.trim()) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ lấy hàng và giao hàng không được trùng nhau.",
      });
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
    let matched = tiers[0]; // tier nhỏ nhất

    for (const t of tiers) {
      const min = Number(t.min_km);
      const max = t.max_km == null ? Infinity : Number(t.max_km);

      if (km >= min && km <= max) {
        matched = t;
        break;
      }
    }
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