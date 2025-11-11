import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Order from "../models/Order";
import bcrypt from "bcryptjs";
import Vehicle from "../models/Vehicle";
import OrderItem from "../models/OrderItem";
import OrderTracking from "../models/OrderTracking";
import OrderStatusLog from "../models/OrderStatusLog";
import OrderMedia from "../models/OrderMedia";
import Feedback from "../models/Feedback";
import Incident from "../models/Incident";

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      email,
      phone,
      password,
      role,
      licenseNumber,
      vehiclePlate,
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin: Họ tên, Email, SĐT, Mật khẩu",
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng",
      });
    }

    // Kiểm tra phone đã tồn tại
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Số điện thoại đã được sử dụng",
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password_hash,
      role: role || "Customer",
      status: "Active",
      licenseNumber: licenseNumber?.trim() || "",
      vehiclePlate: vehiclePlate?.trim() || "",
    });

    // Không trả về password_hash
    const userResponse = newUser.toObject();
    delete userResponse.password_hash;

    return res.status(201).json({
      success: true,
      message: `Tạo ${role || "user"} thành công`,
      data: userResponse,
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi tạo user:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo user",
      error: error.message,
    });
  }
};

/**
 * ➕ Tạo Carrier mới (alias cho createUser với role="Carrier")
 * API: POST /api/admin/carriers
 */
export const createCarrier = async (req: Request, res: Response) => {
  // Force role to be Carrier
  req.body.role = "Carrier";
  return createUser(req, res);
};

/**
 * 🚗 Tạo Vehicle mới
 * API: POST /api/admin/vehicles
 */
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { plate_number, type, capacity, carrier_id, status } = req.body;

    // Validate required fields - đã bỏ enum check
    if (!plate_number || !type || !carrier_id) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ: Biển số xe, Loại xe, Carrier ID",
      });
    }

    // Kiểm tra carrier tồn tại
    const carrier = await User.findById(carrier_id);
    if (!carrier || carrier.role !== "Carrier") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy carrier hoặc user không phải là carrier",
      });
    }

    // Kiểm tra biển số đã tồn tại
    const existingVehicle = await Vehicle.findOne({
      plate_number: plate_number.toUpperCase(),
    });
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Biển số xe đã tồn tại trong hệ thống",
      });
    }

    // Tạo vehicle mới - không cần validate enum
    const newVehicle = await Vehicle.create({
      carrier_id,
      plate_number: plate_number.toUpperCase(),
      type: type.trim(), // Nhận bất kỳ loại xe nào
      capacity: capacity || 500,
      status: status || "Available",
    });

    // Cập nhật vehiclePlate cho carrier
    await User.findByIdAndUpdate(carrier_id, {
      vehiclePlate: plate_number.toUpperCase(),
    });

    return res.status(201).json({
      success: true,
      message: "Tạo phương tiện thành công",
      data: newVehicle,
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi tạo vehicle:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo phương tiện",
      error: error.message,
    });
  }
};
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
        .select(
          "_id full_name email phone status role banReason avatar created_at updated_at"
        )
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

export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "customerId không hợp lệ",
      });
    }

    const query = { customer_id: new mongoose.Types.ObjectId(customerId) };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select(
          "orderCode status total_price pickup_address delivery_address createdAt scheduled_time seller_id carrier_id"
        )
        .populate("seller_id", "full_name email phone")
        .populate("carrier_id", "full_name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Error getting customer orders:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đơn hàng khách hàng",
    });
  }
};

export const updateStatusCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Giả sử id được truyền qua params
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
      data: customer,
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái khách hàng",
    });
  }
};

export const getFeedbackOverview = async (req: Request, res: Response) => {
  try {
    const [feedbackSummary, ratingBreakdown, incidentSummary, recentFeedbacks, recentIncidents] =
      await Promise.all([
        Feedback.aggregate([
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              total: { $sum: 1 },
              positive: {
                $sum: {
                  $cond: [{ $gte: ["$rating", 4] }, 1, 0],
                },
              },
              negative: {
                $sum: {
                  $cond: [{ $lte: ["$rating", 2] }, 1, 0],
                },
              },
            },
          },
        ]),
        Feedback.aggregate([
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Incident.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Feedback.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("customer_id", "full_name email phone")
          .populate("order_id", "orderCode status pickup_address delivery_address")
          .lean(),
        Incident.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("reported_by", "full_name email phone")
          .populate("order_id", "orderCode status pickup_address delivery_address")
          .lean(),
      ]);

    const summary = feedbackSummary[0] || {
      avgRating: 0,
      total: 0,
      positive: 0,
      negative: 0,
    };

    const ratingDistribution = ratingBreakdown.reduce((acc: Record<string, number>, curr) => {
      acc[curr._id ?? "0"] = curr.count;
      return acc;
    }, {});

    const incidentStatus = incidentSummary.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr._id ?? "Unknown"] = curr.count;
        return acc;
      },
      {}
    );

    const serializeFeedback = (item: any) => ({
      id: String(item._id),
      rating: item.rating,
      comment: item.comment || "",
      category: item.category || "General",
      status: item.status,
      priority: item.priority,
      orderCode: item.order_id?.orderCode || "",
      orderId: item.order_id?._id || null,
      customer: item.customer_id
        ? {
            id: item.customer_id._id,
            name: item.customer_id.full_name || item.customer_id.fullName,
            email: item.customer_id.email,
            phone: item.customer_id.phone,
          }
        : null,
      createdAt: item.createdAt,
    });

    const serializeIncident = (item: any) => ({
      id: String(item._id),
      type: item.type,
      description: item.description,
      status: item.status,
      resolution: item.resolution || "",
      orderCode: item.order_id?.orderCode || "",
      orderId: item.order_id?._id || null,
      reporter: item.reported_by
        ? {
            id: item.reported_by._id,
            name: item.reported_by.full_name || item.reported_by.fullName,
            email: item.reported_by.email,
            phone: item.reported_by.phone,
          }
        : null,
      createdAt: item.createdAt,
    });

    return res.status(200).json({
      success: true,
      data: {
        feedbackSummary: {
          total: summary.total,
          avgRating: summary.avgRating ? Number(summary.avgRating.toFixed(1)) : 0,
          positive: summary.positive || 0,
          negative: summary.negative || 0,
          distribution: ratingDistribution,
        },
        incidentSummary: {
          total: Object.values(incidentStatus).reduce((acc, val) => acc + val, 0),
          status: incidentStatus,
        },
        recentFeedbacks: recentFeedbacks.map(serializeFeedback),
        recentIncidents: recentIncidents.map(serializeIncident),
      },
    });
  } catch (error) {
    console.error("Error getting feedback overview:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê feedback",
    });
  }
};

export const getFeedbackList = async (req: Request, res: Response) => {
  try {
    const listType = (req.query.type as string) || "reviews";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = (req.query.status as string) || "all";
    const search = (req.query.search as string) || "";
    const regex = search ? new RegExp(search, "i") : null;

    if (listType === "incidents") {
      const incidentQuery: any = {};
      if (statusFilter !== "all") {
        incidentQuery.status = statusFilter;
      }
      if (regex) {
        incidentQuery.$or = [
          { description: regex },
          { type: regex },
          { resolution: regex },
        ];
      }

      const [items, total] = await Promise.all([
        Incident.find(incidentQuery)
          .populate("reported_by", "full_name email phone")
          .populate("order_id", "orderCode status pickup_address delivery_address")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Incident.countDocuments(incidentQuery),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          type: "incidents",
          items: items.map((item: any) => ({
            id: String(item._id),
            type: item.type,
            description: item.description,
            status: item.status,
            resolution: item.resolution || "",
            orderCode: item.order_id?.orderCode || "",
            orderId: item.order_id?._id || null,
            reporter: item.reported_by
              ? {
                  id: item.reported_by._id,
                  name: item.reported_by.full_name || item.reported_by.fullName,
                  email: item.reported_by.email,
                  phone: item.reported_by.phone,
                }
              : null,
            createdAt: item.createdAt,
          })),
          total,
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    }

    const feedbackQuery: any = {};
    if (statusFilter !== "all") {
      feedbackQuery.status = statusFilter;
    }
    if (regex) {
      feedbackQuery.$or = [
        { comment: regex },
        { category: regex },
      ];
    }

    const [feedbacks, total] = await Promise.all([
      Feedback.find(feedbackQuery)
        .populate("customer_id", "full_name email phone")
        .populate("order_id", "orderCode status pickup_address delivery_address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(feedbackQuery),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        type: "reviews",
        items: feedbacks.map((item: any) => ({
          id: String(item._id),
          rating: item.rating,
          comment: item.comment || "",
          category: item.category || "General",
          status: item.status,
          priority: item.priority,
          orderCode: item.order_id?.orderCode || "",
          orderId: item.order_id?._id || null,
          customer: item.customer_id
            ? {
                id: item.customer_id._id,
                name: item.customer_id.full_name || item.customer_id.fullName,
                email: item.customer_id.email,
                phone: item.customer_id.phone,
              }
            : null,
          createdAt: item.createdAt,
        })),
        total,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Error getting feedback list:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách feedback",
    });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, notes } = req.body || {};
    const updatePayload: any = {};

    if (status) updatePayload.status = status;
    if (priority) updatePayload.priority = priority;
    if (typeof notes === "string") updatePayload.notes = notes;

    const handler = (req as any).user?._id || (req as any).user?.id;
    if (handler) {
      updatePayload.handled_by = handler;
      updatePayload.handled_at = new Date();
    }

    const updated = await Feedback.findByIdAndUpdate(id, updatePayload, {
      new: true,
    })
      .populate("customer_id", "full_name email phone")
      .populate("order_id", "orderCode status pickup_address delivery_address");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy feedback",
      });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật feedback",
    });
  }
};

export const updateIncidentStatusAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body || {};

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sự cố",
      });
    }

    if (status) {
      incident.status = status;
      if (status === "Resolved") {
        incident.resolved_at = new Date();
      }
    }
    if (typeof resolution === "string") {
      incident.resolution = resolution;
    }

    const handler = (req as any).user?._id || (req as any).user?.id;
    if (handler) {
      incident.resolved_by = handler;
    }

    await incident.save();

    await incident.populate("reported_by", "full_name email phone");
    await incident.populate("order_id", "orderCode status pickup_address delivery_address");

    return res.status(200).json({ success: true, data: incident });
  } catch (error) {
    console.error("Error updating incident status:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật sự cố",
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
        completed: stats["Completed"] || 0, // Hoàn thành
        cancelled: stats["Cancelled"] || 0, // Đã hủy
        delivering: stats["Delivering"] || 0, // Đang giao
        pending: stats["Pending"] || 0, // Chờ xử lý
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
export const getPaginationCarriers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [carriers, total] = await Promise.all([
      User.find({ role: "Carrier" })
        .select(
          "_id full_name email phone licenseNumber vehiclePlate status avatar banReason created_at"
        )
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 }),
      User.countDocuments({ role: "Carrier" }),
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

/**
 * 📦 Lấy đơn hàng của carrier cụ thể
 */
export const getCarrierOrders = async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ carrier_id: carrierId })
        .select(
          "_id orderCode status pickup_address delivery_address scheduled_time total_price"
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments({ carrier_id: carrierId }),
    ]);

    res.status(200).json({
      success: true,
      orders,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting carrier orders:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đơn hàng của carrier",
    });
  }
};

/**
 * 🔍 Lấy chi tiết carrier
 */
export const getCarrierDetail = async (req: Request, res: Response) => {
  try {
    const { carrierId } = req.params;

    const carrier = await User.findById(carrierId).select("-password_hash");

    if (!carrier) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy carrier",
      });
    }

    // Lấy thống kê đơn hàng
    const orderStats = await Order.aggregate([
      { $match: { carrier_id: new mongoose.Types.ObjectId(carrierId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Lấy đơn hàng hiện tại
    const currentOrders = await Order.find({
      carrier_id: carrierId,
      status: {
        $in: ["ASSIGNED", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "DELIVERING"],
      },
    })
      .select(
        "orderCode status pickup_address delivery_address scheduled_time total_price"
      )
      .limit(5)
      .sort({ scheduled_time: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...carrier.toObject(),
        orderStats,
        currentOrders,
      },
    });
  } catch (error) {
    console.error("Error getting carrier detail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết carrier",
    });
  }
};

/**
 * 📦 Lấy chi tiết đơn hàng đầy đủ cho admin
 * API: GET /api/admin/orders/:id
 */
export const getAdminOrderDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Lấy đơn hàng với tất cả các populate
    const order = await Order.findById(id)
      .populate("customer_id", "full_name email phone avatar")
      .populate("seller_id", "full_name email phone avatar")
      .populate("carrier_id", "full_name email phone avatar")
      .populate("assignedCarrier", "full_name email phone avatar")
      .populate("acceptedBy", "full_name email phone avatar")
      .populate("package_id")
      .populate("vehicle_id")
      .populate("extra_fees")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Lấy các dữ liệu liên quan
    const [items, trackings, statusLogs, media] = await Promise.all([
      OrderItem.find({ order_id: id }).lean(),
      OrderTracking.find({ order_id: id })
        .populate("carrier_id", "full_name email phone")
        .sort({ createdAt: -1 })
        .lean(),
      OrderStatusLog.find({ order_id: id })
        .populate("updated_by", "full_name email")
        .sort({ createdAt: -1 })
        .lean(),
      OrderMedia.find({ order_id: id })
        .populate("uploaded_by", "full_name email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Kết hợp tất cả dữ liệu
    const orderDetail = {
      ...order,
      items,
      trackings,
      statusLogs,
      media,
    };

    res.status(200).json({
      success: true,
      data: orderDetail,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn hàng",
    });
  }
};
