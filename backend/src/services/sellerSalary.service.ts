
import mongoose from "mongoose";
import SellerSalary from "../models/SellerSalary";
import Order from "../models/Order"; // giả định đã có model Order
// Order cần có: seller_id, status, created_at

type CalcOptions = {
  baseSalary?: number;
  commissionPerOrder?: number;
  kpiBonus?: (successful: number, failed: number) => number; // hàm tính bonus mở rộng
};

export async function calculateSellerSalary(
  sellerId: string,
  month: number,
  year: number,
  opts: CalcOptions = {}
) {
  const baseSalary = opts.baseSalary ?? 5_000_000;
  const commissionPerOrder = opts.commissionPerOrder ?? 5_000;
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  // Thống kê đơn theo tháng
  const agg = await Order.aggregate([
    {
      $match: {
        seller_id: new mongoose.Types.ObjectId(sellerId),
        created_at: { $gte: from, $lt: to },
      },
    },
    {
      $group: {
        _id: null,
        total_orders: { $sum: 1 },
        successful_orders: {
          $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
        },
        failed_orders: {
          $sum: { $cond: [{ $in: ["$status", ["Cancelled", "Failed"]] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = agg[0] ?? { total_orders: 0, successful_orders: 0, failed_orders: 0 };
  const bonus =
    opts.kpiBonus?.(stats.successful_orders, stats.failed_orders) ??
    (stats.successful_orders > 100 ? 500_000 : 0);

  const total_earning = baseSalary + stats.successful_orders * commissionPerOrder + bonus;

  // Upsert (tạo mới nếu chưa có, cập nhật nếu đã có)
  const record = await SellerSalary.findOneAndUpdate(
    { seller_id: sellerId, month, year },
    {
      $set: {
        base_salary: baseSalary,
        commission_per_order: commissionPerOrder,
        total_orders: stats.total_orders,
        successful_orders: stats.successful_orders,
        failed_orders: stats.failed_orders,
        bonus,
        total_earning,
      },
    },
    { new: true, upsert: true }
  ).populate("seller_id", "full_name email");

  return record;
}

export async function getSellerSalary(sellerId: string, month: number, year: number) {
  return SellerSalary.findOne({ seller_id: sellerId, month, year }).populate(
    "seller_id",
    "full_name email"
  );
}

export async function listSellerSalaries(params: {
  month?: number;
  year?: number;
  sellerId?: string;
  page?: number;
  limit?: number;
}) {
  const { month, year, sellerId, page = 1, limit = 20 } = params;
  const query: any = {};
  if (month) query.month = month;
  if (year) query.year = year;
  if (sellerId) query.seller_id = sellerId;

  const [items, total] = await Promise.all([
    SellerSalary.find(query)
      .populate("seller_id", "full_name email")
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SellerSalary.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSalariesSummary(month: number, year: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  // Tổng seller + tổng cost dựa trên bảng lương
  const agg = await SellerSalary.aggregate([
    { $match: { month, year } },
    {
      $group: {
        _id: null,
        totalSellers: { $sum: 1 },
        totalCost: { $sum: "$total_earning" },
        totalBonus: { $sum: "$bonus" },
        totalSuccessOrders: { $sum: "$successful_orders" },
      },
    },
  ]);

  // fallback nếu chưa chạy tính lương => 0
  const summary = agg[0] ?? {
    totalSellers: 0,
    totalCost: 0,
    totalBonus: 0,
    totalSuccessOrders: 0,
  };

  return { month, year, ...summary, period: { from, to } };
}
