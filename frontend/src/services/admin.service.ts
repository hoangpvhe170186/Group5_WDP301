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
  code: o.code || "",
  status: o.status || "",
  price: o.total_price || 0,
  seller: o.seller_id || null,
  driver: o.driver_id || null,
  customer: o.customer_id || null,
  createdAt: o.createdAt
    ? new Date(o.createdAt).toLocaleString("vi-VN")
    : "",
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
    return {
      orders: data.data.map(normalizeOrder),
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  },
};
