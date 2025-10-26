import { Request, Response } from "express";
import User from "../models/User";
import Order from "../models/Order";

/**
 * 📊 Lấy thống kê tổng quan Dashboard
 */
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    // Tổng số user theo vai trò
    const [totalCustomers, totalDrivers, totalSellers] = await Promise.all([
      User.countDocuments({ role: "Customer" }),
      User.countDocuments({ role: "Driver" }),
      User.countDocuments({ role: "Seller" }),
    ]);

    // Tổng đơn hàng và tổng doanh thu
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total_price" }, // Giả sử có trường total_price
        },
      },
    ]);

    const totalOrders = orders[0]?.totalOrders || 0;
    const totalRevenue = orders[0]?.totalRevenue || 0;

    // Biểu đồ đơn hàng theo ngày (7 ngày gần nhất)
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]);

    const ordersByTime = orderStats
      .map((d) => ({
        date: d._id,
        count: d.count,
      }))
      .reverse();

    const revenueByTime = orderStats
      .map((d) => ({
        date: d._id,
        total: d.totalRevenue,
      }))
      .reverse();

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalDrivers,
        totalSellers,
        totalOrders,
        totalRevenue,
        ordersByTime,
        revenueByTime,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy thống kê dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê dashboard",
    });
  }
};


export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const match: any = {};
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const result = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalRevenue: { $sum: "$total_price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: result.map((r) => ({
        date: r._id,
        totalRevenue: r.totalRevenue,
        totalOrders: r.count,
      })),
    });
  } catch (error) {
    console.error("❌ Lỗi khi thống kê doanh thu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thống kê doanh thu",
    });
  }
};