import { Request, Response } from "express";
import PricePackage from "../models/PricePackage";
import PricePerKm from "../models/PricePerKm";

// [MỚI] GET /api/pricing/details/:packageName
// Lấy toàn bộ thông tin chi tiết của 1 gói cước (dựa vào name)
export const getPricingDetailsByName = async (req: Request, res: Response) => {
  try {
    const { packageName } = req.params;
    // Tìm gói cước theo tên
    const pkg = await PricePackage.findOne({ name: packageName }).lean();

    if (!pkg) {
      return res.status(404).json({ message: "Không tìm thấy gói cước" });
    }

    const tiers = await PricePerKm.find({ package_id: pkg._id }).sort({ min_km: 1 }).lean();

    res.status(200).json({ package: pkg, tiers });

  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết gói cước." });
  }
};

// [SỬA LẠI] POST /api/pricing/calc
export const calcPrice = async (req: Request, res: Response) => {
  try {
    const { packageId, distanceKm } = req.body; // packageId bây giờ là ObjectID

    if (!packageId || typeof distanceKm !== "number" || distanceKm < 0) {
      return res.status(400).json({ success: false, message: "packageId và distanceKm là bắt buộc và hợp lệ" });
    }

    const pkg = await PricePackage.findById(packageId).lean();
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy package" });
    }
    
    const tiers = await PricePerKm.find({ package_id: pkg._id }).sort({ min_km: 1 }).lean();

    const matched = tiers.find(t => {
      if (t.max_km == null) return distanceKm >= t.min_km;
      return distanceKm >= t.min_km && distanceKm <= t.max_km;
    });

    if (!matched) {
      return res.status(400).json({ success: false, message: "Khoảng cách không nằm trong bất kỳ mức giá nào" });
    }

    const basePrice = Number(pkg.base_price.toString());
    const perKmPrice = Number(matched.price.toString());
    
    // Sửa lại công thức tính toán cho đúng
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
    console.error("calcPrice error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi tính giá" });
  }
};