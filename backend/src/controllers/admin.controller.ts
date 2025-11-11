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
      User.countDocuments({ role: "Carrier" }),
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
        .populate("carrier_id")
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

    const [carriers, total] = await Promise.all([
      User.find({ role: "Carrier", status: "Active" })
        .select("_id full_name email phone")
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "Carrier", status: "Active" }),
    ]);

    res.status(200).json({
      success: true,
      data: carriers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting carriers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách carrier",
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


/**
 * 📊 Lấy thống kê trạng thái đơn hàng (cho Pie Chart)
 * API: GET /api/admin/orders/status-stats
 */
export const getOrderStatusStats = async (req: Request, res: Response) => {
  try {
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Chuyển đổi thành object dễ sử dụng
    const stats = statusStats.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        completed: stats["Completed"] || 0,      // Hoàn thành
        cancelled: stats["Cancelled"] || 0,      // Đã hủy
        delivering: stats["Delivering"] || 0,    // Đang giao
        pending: stats["Pending"] || 0,          // Chờ xử lý
        // Thêm các trạng thái khác nếu có
        confirmed: stats["Confirmed"] || 0,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy thống kê trạng thái đơn hàng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê trạng thái đơn hàng",
    });
  }
};

/**
 * 🚗 Lấy hiệu suất tài xế (cho Bar Chart)
 * API: GET /api/admin/carriers/performance?limit=5
 */
export const getDriverPerformance = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    // Aggregate đơn hàng theo tài xế
    const driverStats = await Order.aggregate([
      {
        $match: {
          carrier_id: { $ne: null }, // Chỉ lấy đơn có tài xế
        },
      },
      {
        $group: {
          _id: "$carrier_id",
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users", // Tên collection của User
          localField: "_id",
          foreignField: "_id",
          as: "driverInfo",
        },
      },
      {
        $unwind: "$driverInfo",
      },
      {
        $project: {
          carrierId: "$_id",
          driverName: "$driverInfo.full_name",
          totalOrders: 1,
          completedOrders: 1,
        },
      },
      {
        $sort: { completedOrders: -1 }, // Sắp xếp theo số chuyến hoàn thành
      },
      {
        $limit: limit,
      },
    ]);

    return res.status(200).json({
      success: true,
      data: driverStats,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy hiệu suất tài xế:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy hiệu suất tài xế",
    });
  }
};

/**
 * 📈 Lấy dashboard với % thay đổi so với tháng trước
 * API: GET /api/admin/dashboard/enhanced
 */
export const getDashboardEnhanced = async (req: Request, res: Response) => {
  try {
    // Ngày hiện tại và tháng trước
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ===== THÁNG NÀY =====
    const [
      totalCustomersNow,
      totalDriversNow,
      totalSellersNow,
      ordersThisMonth,
    ] = await Promise.all([
      User.countDocuments({ role: "Customer" }),
      User.countDocuments({ role: "Carrier" }),
      User.countDocuments({ role: "Seller" }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfThisMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$total_price" },
          },
        },
      ]),
    ]);

    const totalOrdersNow = ordersThisMonth[0]?.totalOrders || 0;
    const totalRevenueNow = ordersThisMonth[0]?.totalRevenue || 0;

    // ===== THÁNG TRƯỚC =====
    const [
      totalCustomersLast,
      totalDriversLast,
      totalSellersLast,
      ordersLastMonth,
    ] = await Promise.all([
      User.countDocuments({
        role: "Customer",
        createdAt: { $lt: startOfThisMonth },
      }),
      User.countDocuments({
        role: "Carrier",
        createdAt: { $lt: startOfThisMonth },
      }),
      User.countDocuments({
        role: "Seller",
        createdAt: { $lt: startOfThisMonth },
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfLastMonth,
              $lte: endOfLastMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$total_price" },
          },
        },
      ]),
    ]);

    const totalOrdersLast = ordersLastMonth[0]?.totalOrders || 0;
    const totalRevenueLast = ordersLastMonth[0]?.totalRevenue || 0;

    // ===== TÍNH % THAY ĐỔI =====
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalCustomersChange = calculateChange(
      totalCustomersNow,
      totalCustomersLast
    );
    const totalOrdersChange = calculateChange(totalOrdersNow, totalOrdersLast);
    const totalRevenueChange = calculateChange(
      totalRevenueNow,
      totalRevenueLast
    );

    // ===== BIỂU ĐỒ 7 NGÀY GẦN NHẤT =====
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
        totalCustomers: totalCustomersNow,
        totalCustomersChange,
        
        totalDrivers: totalDriversNow,
        totalDriversChange: calculateChange(totalDriversNow, totalDriversLast),
        
        totalSellers: totalSellersNow,
        totalSellersChange: calculateChange(totalSellersNow, totalSellersLast),
        
        totalOrders: totalOrdersNow,
        totalOrdersChange,
        
        totalRevenue: totalRevenueNow,
        totalRevenueChange,
        
        ordersByTime,
        revenueByTime,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy dashboard enhanced:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dashboard enhanced",
    });
  }
};