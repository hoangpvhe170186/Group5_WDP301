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
  role: "Customer" | "Seller" | "Carrier" | "Admin";
  status: "Active" | "Inactive" | "Banned";
  banReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 🚚 Kiểu dữ liệu tài xế (Carrier)
 */
export interface Carrier extends User {
  licenseNumber: string;
  vehiclePlate: string;
  totalTrips: number;
  completedTrips: number;
  earnings: number;
  commissionPaid: number;
  rating: number;
  joinDate: string;
  lastActive: string;
  vehicle?: {
    plate: string;
    type: string;
    capacity: number;
    status: string;
  };
  currentOrders?: Array<{
    id: string;
    orderCode: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
  }>;
  reviews?: Array<{
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  reports?: Array<{
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
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
  carrier?: any;
  customer?: any;
  createdAt: string;
}

/**
 * 🚗 Kiểu dữ liệu phương tiện
 */
export interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity: number;
  status: string;
  carrier_id: string;
  carrier_name?: string;
  created_at: string;
  updated_at: string;
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
  id: String(u._id || u.id),
  fullName: u.full_name || u.fullName || "",
  email: u.email || "",
  phone: u.phone || "",
  avatar: u.avatar || "",
  role: u.role || "Customer",
  status: u.status || "Active",
  banReason: u.banReason || "",
  createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : "",
  updatedAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString("vi-VN") : "",
});

/**
 * Chuẩn hóa dữ liệu tài xế từ backend
 */
const normalizeCarrier = (c: any): Carrier => ({
  ...normalizeUser(c),
  licenseNumber: c.licenseNumber || "",
  vehiclePlate: c.vehiclePlate || "",
  totalTrips: c.totalTrips || 0,
  completedTrips: c.completedTrips || 0,
  earnings: c.earnings || 0,
  commissionPaid: c.commissionPaid || 0,
  rating: c.rating || 0,
  joinDate: c.joinDate || c.createdAt || "",
  lastActive: c.lastActive || "",
  vehicle: c.vehicle || undefined,
  currentOrders: c.currentOrders || [],
  reviews: c.reviews || [],
  reports: c.reports || [],
});

/**
 * Chuẩn hóa dữ liệu đơn hàng
 */
const normalizeOrder = (o: any): Order => ({
  id: String(o._id || o.id),
  code: o.orderCode || o.code || "",
  status: o.status || "",
  price: o.total_price || o.price || 0,
  seller: o.seller_id || o.seller || null,
  customer: o.customer_id || o.customer || null,
  carrier: o.carrier_id || o.carrier || null,
  createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "",
  pickupAddress: o.pickup_address || o.pickupAddress || "",
  deliveryAddress: o.delivery_address || o.deliveryAddress || "",
});

/**
 * Chuẩn hóa dữ liệu phương tiện
 */
const normalizeVehicle = (v: any): Vehicle => ({
  id: String(v._id || v.id),
  plate_number: v.plate_number || v.plateNumber || "",
  type: v.type || "",
  capacity: v.capacity || 0,
  status: v.status || "Available",
  carrier_id: v.carrier_id || v.carrierId || "",
  carrier_name: v.carrier_name || v.carrierName || "",
  created_at: v.created_at || v.createdAt || "",
  updated_at: v.updated_at || v.updatedAt || "",
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
   * API: GET /api/admin/carriers/performance
   */
  async getDriverPerformance(limit: number = 5): Promise<DriverPerformance[]> {
    const { data } = await api.get("/admin/carriers/performance", {
      params: { limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data.map(normalizeDriverPerformance);
  },

  // ===========================================================
  // 👥 USER MANAGEMENT
  // ===========================================================
  /**
   * 🔍 Lấy danh sách user theo vai trò (Customer / Carrier / Seller)
   * API: GET /api/admin/{role}/pagination?page=1&limit=10
   */
  async getUsersByRole(
    role: "customers" | "carriers" | "sellers",
    page = 1,
    limit = 10
  ) {
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
   * 📄 Lấy chi tiết user
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

  /**
   * 🔒 Cập nhật trạng thái user (ban/unban)
   * API: PUT /api/users/:id
   */
  async updateUserStatus(
    id: string,
    payload: { status: string; banReason?: string }
  ): Promise<User> {
    const { data } = await api.put(`/users/${id}`, payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeUser(data.data || data);
  },

  // ===========================================================
  // 🚚 CARRIER MANAGEMENT
  // ===========================================================
  /**
   * Lấy danh sách tài xế phân trang
   * API: GET /api/admin/carriers/pagination
   */
  async getPaginationCarriers(page = 1, limit = 10) {
    const { data } = await api.get("/admin/carriers/pagination", {
      params: { page, limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    return {
      data: data.data.map(normalizeCarrier),
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  },

  /**
   * 🔍 Lấy chi tiết carrier
   * API: GET /api/admin/carriers/:id
   */
  async getCarrierDetail(carrierId: string): Promise<Carrier> {
    const { data } = await api.get(`/admin/carriers/${carrierId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeCarrier(data.data || data);
  },

  /**
   * 📦 Lấy đơn hàng của carrier
   * API: GET /api/admin/carriers/:id/orders
   */
  async getCarrierOrders(carrierId: string, page = 1, limit = 10) {
    try {
      const { data } = await api.get(`/admin/carriers/${carrierId}/orders`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      return {
        orders:
          data.data?.map(normalizeOrder) ||
          data.orders?.map(normalizeOrder) ||
          [],
        total: data.total || 0,
        currentPage: data.currentPage || page,
        totalPages: data.totalPages || 1,
      };
    } catch (error) {
      console.error(`Error fetching orders for carrier ${carrierId}:`, error);
      return {
        orders: [],
        total: 0,
        currentPage: page,
        totalPages: 1,
      };
    }
  },

  /**
   * 🚗 Lấy phương tiện của carrier
   * API: GET /api/admin/carriers/:id/vehicle
   */
  async getCarrierVehicle(carrierId: string) {
    const { data } = await api.get(`/admin/carriers/${carrierId}/vehicle`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeVehicle(data.data || data);
  },

  /**
   * 💰 Lấy thông tin tài chính của carrier
   * API: GET /api/admin/carriers/:id/financials
   */
  async getCarrierFinancials(carrierId: string) {
    const { data } = await api.get(`/admin/carriers/${carrierId}/financials`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data.data;
  },

  /**
   * 🔒 Khóa tài xế
   * API: POST /api/admin/carriers/:id/ban
   */
  async banCarrier(carrierId: string, reason: string) {
    const { data } = await api.post(
      `/admin/carriers/${carrierId}/ban`,
      { reason },
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data.data;
  },

  /**
   * 🔓 Mở khóa tài xế
   * API: POST /api/admin/carriers/:id/unban
   */
  async unbanCarrier(carrierId: string) {
    const { data } = await api.post(
      `/admin/carriers/${carrierId}/unban`,
      {},
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      }
    );
    return data.data;
  },

  // ===========================================================
  // 🚗 VEHICLE MANAGEMENT
  // ===========================================================
  /**
   * 🚗 Lấy danh sách phương tiện
   * API: GET /api/admin/vehicles
   */
  async listVehicles(params: any = {}) {
    const { data } = await api.get(`/admin/vehicles`, {
      params,
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return {
      vehicles: data.data?.map(normalizeVehicle) || [],
      total: data.total || 0,
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1,
    };
  },

  /**
   * ➕ Tạo phương tiện mới
   * API: POST /api/admin/vehicles
   */
  async createVehicle(payload: any) {
    const { data } = await api.post(`/admin/vehicles`, payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeVehicle(data.data || data);
  },

  // ===========================================================
  // ➕ CREATE OPERATIONS
  // ===========================================================
  /**
   * ➕ Tạo user mới
   * API: POST /api/admin/users
   */
  async createUser(payload: any) {
    const { data } = await api.post(`/admin/users`, payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeUser(data.data || data.user || data);
  },

  /**
   * ➕ Tạo tài xế mới
   * API: POST /api/admin/carriers
   */
  async createCarrier(payload: any) {
    const { data } = await api.post(`/admin/carriers`, payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeCarrier(data.data || data.carrier || data);
  },

  /**
   * 🔍 Tìm kiếm users
   * API: GET /api/admin/users
   */
  async searchUsers(params: any = {}) {
    const { data } = await api.get(`/admin/users`, {
      params,
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return {
      users: data.data?.map(normalizeUser) || [],
      total: data.total || 0,
    };
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

  /**
   * Lấy chi tiết đơn hàng đầy đủ (cho admin)
   * API: GET /api/admin/orders/:id
   */
  async getOrderDetail(orderId: string) {
    try {
      const { data } = await api.get(`/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      console.log("📦 API Response:", data);
      if (data.success && data.data) {
        return data.data;
      }
      return data.data || data;
    } catch (error: any) {
      console.error("❌ API Error:", error.response?.data || error.message);
      throw error;
    }
  },
};
