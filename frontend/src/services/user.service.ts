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
 * Kiểu dữ liệu User
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
 * Chuẩn hóa dữ liệu người dùng
 */
const normalizeUser = (u: any): User => ({
  id: String(u._id),
  fullName: u.full_name || "",
  email: u.email || "",
  phone: u.phone || "",
  avatar: u.avatar || "",
  role: u.role || "Customer",
  status: u.status || "Active",
  createdAt: u.created_at
    ? new Date(u.created_at).toLocaleString("vi-VN")
    : "",
  updatedAt: u.updated_at
    ? new Date(u.updated_at).toLocaleString("vi-VN")
    : "",
});

/**
 * 📘 API Service cho User / Customer / Driver / Seller
 */
export const userApi = {
  /**
   * 🔍 Lấy danh sách user phân trang, có thể lọc role, status, search
   */
  async list(filters?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total?: number }> {
    try {
      const { data } = await api.get("/users", {
        params: filters,
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      const users: User[] = Array.isArray(data.data)
        ? data.data.map(normalizeUser)
        : [];

      return { users, total: data.total || users.length };
    } catch (error: any) {
      console.error("❌ list users error:", error);
      throw new Error("Không thể tải danh sách người dùng");
    }
  },

  /**
   * 📄 Lấy chi tiết user
   */
  async getDetail(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeUser(data.data || data);
  },

  /**
   * ✏️ Cập nhật / vô hiệu hóa / kích hoạt user
   */
  async update(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.put(`/users/${id}`, payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return normalizeUser(data.data || data);
  },

  /**
   * 🗑️ Xóa user
   */
  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/users/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return { message: data.message || "Đã xóa người dùng thành công" };
  },

  /**
   * 👥 Lấy danh sách Customer (phân trang)
   */
  async getCustomers(page = 1, limit = 10) {
    const { data } = await api.get("/users/customers/pagination", {
      params: { page, limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return {
      customers: data.data.map(normalizeUser),
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  },

  /**
   * 🚚 Lấy danh sách Driver (phân trang)
   */
  async getDrivers(page = 1, limit = 10) {
    const { data } = await api.get("/users/drivers/pagination", {
      params: { page, limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return {
      drivers: data.data.map(normalizeUser),
      total: data.total,
    };
  },

  /**
   * 🏪 Lấy danh sách Seller (phân trang)
   */
  async getSellers(page = 1, limit = 10) {
    const { data } = await api.get("/users/sellers/pagination", {
      params: { page, limit },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return {
      sellers: data.data.map(normalizeUser),
      total: data.total,
    };
  },
};
