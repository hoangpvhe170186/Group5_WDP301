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

export const getPaginationAllOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate("seller_id")
        .populate("package_id")
        .populate("driver_id")
        .populate("customer_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng nào" });
    }

    res.json({
      success: true,
      data: orders,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};

// -----------------------------

export const getPaginationDrivers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [drivers, total] = await Promise.all([
      User.find({ role: "Driver", status: "Active" })
        .select("_id full_name email phone")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Driver", status: "Active" }),
    ]);

    res.status(200).json({
      success: true,
      data: drivers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting drivers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách driver",
    });
  }
};



export const getPaginationSellers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      User.find({ role: "Seller", status: "Active" })
        .select("_id full_name email phone")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Seller", status: "Active" }),
    ]);

    res.status(200).json({
      success: true,
      data: sellers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting sellers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách seller",
    });
  }
};

export const getPaginationCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      User.find({ role: "Customer" })
        .select("_id full_name email phone status")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Customer" }),
    ]); 

    res.status(200).json({
      success: true,
      data: customers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting customers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách customer",
    });
  }
};


export const updateStatusCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;  // Giả sử id được truyền qua params
    const { status, banReason } = req.body;
    
    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng nào" });
    }
    
    customer.status = status;
    
    // Chỉ cập nhật banReason nếu status là Banned
    if (status === "Banned") {
      customer.banReason = banReason;
    } else {
      customer.banReason = undefined;
    }
    
    await customer.save();
    
    res.status(200).json({ 
      success: true,
      message: "Cập nhật trạng thái khách hàng thành công",
      data: customer
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái khách hàng",
    });
  }
};