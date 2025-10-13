import { Request, Response } from "express";
import PricePackage from "../models/PricePackage";
import PricePerKm from "../models/PricePerKm";

/**
 * @route   GET /api/pricing
 * @desc    Lấy danh sách tất cả các gói cước, có đính kèm thông tin xe.
 */
export const getAllPricePackages = async (req: Request, res: Response) => {
  try {
    const packages = await PricePackage.find({})
      .populate({
        path: 'vehicle',
        select: 'name capacity image' 
      })
      .sort({ name: 1 })
      .lean();
      
    res.status(200).json({ success: true, packages });
  } catch (error) {
    console.error("Lỗi khi tải danh sách gói cước:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tải danh sách gói cước." });
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