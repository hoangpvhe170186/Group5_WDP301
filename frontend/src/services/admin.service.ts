import api from "@/lib/axios";

/**
 * 📦 Lấy token xác thực từ localStorage / sessionStorage
 */
export const getAuthToken = (): string => {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("auth_token") ||
    ""
  );
};

/**
 * 🧍‍♂️ Kiểu dữ liệu người dùng
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "Customer" | "Driver" | "Seller" | "Admin";
  status: "Active" | "Inactive" | "Banned";
  banReason?: string; // Add this line
  createdAt: string;
  updatedAt: string;
}

/**
 * 📦 Kiểu dữ liệu đơn hàng
 */
export interface Order {
  id: string;
  code: string;
  status: string;
  price: number;
  pickupAddress: string;
  deliveryAddress: string;
  seller?: any;
  driver?: any;
  customer?: any;
  createdAt: string;
}

/**
 * 📊 Kiểu dữ liệu thống kê dashboard
 */
export interface DashboardStats {
  totalCustomers: number;
  totalDrivers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByTime: { date: string; count: number }[];
  revenueByTime: { date: string; total: number }[];
}

/**
 * 📊 Kiểu dữ liệu thống kê trạng thái đơn hàng
 */
export interface OrderStatusStats {
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  total: number;
}

/**
 * 📊 Kiểu dữ liệu dashboard nâng cao
 */
export interface EnhancedDashboardStats extends DashboardStats {
  totalComplaints: number;
  averageOrderValue: number;
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
  customerGrowth: { date: string; count: number }[];
}

/**
 * 📊 Kiểu dữ liệu hiệu suất tài xế
 */
export interface DriverPerformance {
  id: string;
  name: string;
  avatar?: string;
  trips: number;
  rating: number;
  earnings: number;
  completionRate: number;
  onTimeDelivery: number;
}

/**
 * Chuẩn hóa dữ liệu người dùng từ backend
 */
const normalizeUser = (u: any): User => ({
  id: String(u._id),
  fullName: u.full_name || "",
  email: u.email || "",
  phone: u.phone || "",
  avatar: u.avatar || "",
  role: u.role || "Customer",
  status: u.status || "Active",
  banReason: u.banReason || "",
  createdAt: u.createdAt
    ? new Date(u.createdAt).toLocaleString("vi-VN")
    : "",
  updatedAt: u.updatedAt
    ? new Date(u.updatedAt).toLocaleString("vi-VN")
    : "",
});

/**
 * Chuẩn hóa dữ liệu đơn hàng
 */
const normalizeOrder = (o: any): Order => ({
  id: String(o._id),
  code: o.orderCode || "",
  status: o.status || "",
  price: o.total_price || 0,
  seller: o.seller_id || null,
  driver: o.driver_id || null,
  customer: o.customer_id || null,
  createdAt: o.createdAt
    ? new Date(o.createdAt).toLocaleString("vi-VN")
    : "",
  pickupAddress: o.pickup_address || "",
  deliveryAddress: o.delivery_address || "",
});

/**
 * Chuẩn hóa dữ liệu hiệu suất tài xế
 */
const normalizeDriverPerformance = (d: any): DriverPerformance => ({
  id: String(d._id || d.id),
  name: d.name || d.full_name || "",
  avatar: d.avatar || "",
  trips: d.trips || 0,
  rating: d.rating || 0,
  earnings: d.earnings || 0,
  completionRate: d.completionRate || 0,
  onTimeDelivery: d.onTimeDelivery || 0,
});

/**
 * 🌐 Service dành cho Admin (Dashboard, User, Order)
 */
export const adminApi = {
  // ===========================================================
  // 📊 DASHBOARD
  // ===========================================================
  /**
   * 📈 Lấy thống kê tổng quan Dashboard
   * API: GET /api/admin/dashboard
   */
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get("/admin/dashboard", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data;
  },

  /**
   * 📈 Lấy thống kê dashboard nâng cao
   * API: GET /api/admin/dashboard/enhanced
   */
  async getDashboardEnhanced(): Promise<EnhancedDashboardStats> {
    const { data } = await api.get("/admin/dashboard/enhanced", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data;
  },

  /**
   * 💰 Lấy thống kê doanh thu theo thời gian
   * API: GET /api/admin/revenue?startDate=...&endDate=...
   */
  async getRevenueStats(startDate: string, endDate: string) {
    const { data } = await api.get("/admin/revenue", {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data;
  },

  /**
   * 📦 Lấy thống kê trạng thái đơn hàng
   * API: GET /api/admin/orders/status
   */
  async getOrderStatusStats(): Promise<OrderStatusStats> {
    const { data } = await api.get("/admin/orders/status", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data;
  },

  /**
   * 🚚 Lấy thống kê hiệu suất tài xế
   * API: GET /api/admin/drivers/performance
   */
  async getDriverPerformance(limit: number = 5): Promise<DriverPerformance[]> {
    const { data } = await api.get("/admin/drivers/performance", {
      params: { limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data.map(normalizeDriverPerformance);
  },

  // ===========================================================
  // 👥 USER MANAGEMENT
  // ===========================================================
  /**
   * 🔍 Lấy danh sách user theo vai trò (Customer / Driver / Seller)
   * API: GET /api/admin/{role}/pagination?page=1&limit=10
   */
  async getUsersByRole(role: "customers" | "drivers" | "sellers", page = 1, limit = 10) {
    const { data } = await api.get(`/admin/${role}/pagination`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return {
      users: data.data.map(normalizeUser),
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  },

  /**
   * 📄 Lấy chi tiết user (giữ endpoint cũ)
   * API: GET /api/users/:id
   */
  async getUserDetail(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeUser(data.data || data);
  },

  /**
   * ✏️ Cập nhật thông tin user (kích hoạt / vô hiệu hóa)
   * API: PUT /api/users/:id
   */
  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.put(`/users/${id}`, payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeUser(data.data || data);
  },

  /**
   * 🗑️ Xóa user
   * API: DELETE /api/users/:id
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/users/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return { message: data.message || "Đã xóa người dùng thành công" };
  },

  // ===========================================================
  // 📦 ORDER MANAGEMENT
  // ===========================================================
  /**
   * Lấy danh sách đơn hàng phân trang
   * API: GET /api/admin/orders/pagination
   */
  async getOrders(page = 1, limit = 10) {
    const { data } = await api.get("/admin/orders/pagination", {
      params: { page, limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    console.log(data);
    return {
      orders: data.data.map(normalizeOrder),
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  },
};