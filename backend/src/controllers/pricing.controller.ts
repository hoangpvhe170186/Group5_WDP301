import { Request, Response } from "express";
import PricePackage from "../models/PricePackage";
import PricePerKm from "../models/PricePerKm";

// POST /api/pricing/calc
// body: { packageId: string, distanceKm: number }
export const calcPrice = async (req: Request, res: Response) => {
  try {
    const { packageId, distanceKm } = req.body;

    if (!packageId || typeof distanceKm !== "number") {
      return res.status(400).json({ success: false, message: "packageId và distanceKm là bắt buộc" });
    }

    let pkg = await PricePackage.findById(packageId).lean();
    // If not found (for demo frontend using ids like 'small'), provide a fallback demo package
    if (!pkg) {
      const demos: any = {
        small: { _id: 'small', name: 'Gói nhỏ', base_price: 150000 },
        standard: { _id: 'standard', name: 'Gói tiêu chuẩn', base_price: 250000 },
        large: { _id: 'large', name: 'Gói lớn', base_price: 400000 },
      };
      pkg = demos[packageId] ?? null;
    }
    if (!pkg) return res.status(404).json({ success: false, message: "Không tìm thấy package" });

    // load tiers for this package
    let tiers = await PricePerKm.find({ package_id: packageId }).sort({ min_km: 1 }).lean();
    // fallback demo tiers when none in DB
    if (!tiers || tiers.length === 0) {
      const demoTiers: any = {
        small: [
          { min_km: 0, max_km: 5, price: 15000 },
          { min_km: 6, max_km: 20, price: 12000 },
          { min_km: 21, max_km: null, price: 10000 },
        ],
        standard: [
          { min_km: 0, max_km: 5, price: 30000 },
          { min_km: 6, max_km: 20, price: 15218 },
          { min_km: 21, max_km: null, price: 12800 },
        ],
        large: [
          { min_km: 0, max_km: 5, price: 48000 },
          { min_km: 6, max_km: 20, price: 19636 },
          { min_km: 21, max_km: null, price: 14236 },
        ],
      };
      tiers = demoTiers[packageId] ?? [];
    }

    // find matching tier for distance
    // tiers have min_km, max_km (nullable), price (Decimal128)
    let matched: any = null;
    for (const t of tiers) {
      const min = t.min_km ?? 0;
      const max = t.max_km ?? null;
      if (max === null) {
        if (distanceKm >= min) {
          matched = t;
          break;
        }
      } else {
        if (distanceKm >= min && distanceKm <= max) {
          matched = t;
          break;
        }
      }
    }

    // fallback: if no matched tier, use last tier if exists
    if (!matched && tiers.length > 0) matched = tiers[tiers.length - 1];

    const basePrice = pkg.base_price ? Number(pkg.base_price.toString()) : 0;
    const perKmPrice = matched ? Number(matched.price.toString()) : 0;

    const totalFee = Math.round((basePrice + perKmPrice) );

    res.json({
      success: true,
      data: {
        package: { id: pkg._id, name: pkg.name, base_price: basePrice },
        distanceKm,
        matchedTier: matched ? { min_km: matched.min_km, max_km: matched.max_km, price: Number(matched.price.toString()) } : null,
        totalFee,
      },
    });
  } catch (err) {
    console.error("calcPrice error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi tính giá" });
  }
};
