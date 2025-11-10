// src/services/user.service.ts
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
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hàm tiện ích chuẩn hóa dữ liệu user từ backend
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
 * 📘 API Service cho User
 */
export const userApi = {
  /**
   * 🔍 Lấy danh sách user với bộ lọc (role, status, search, phân trang)
   * API: GET /users?role=Carrier&status=Active&search=An&page=1&limit=20
   */
  async listUsers(
    filters?: { role?: string; status?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ users: User[]; total?: number }> {
    try {
      const params: any = {};

      if (filters?.role && filters.role !== "all") params.role = filters.role;
      if (filters?.status && filters.status !== "all") params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;

      const { data } = await api.get("/users", {
        params,
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      const rawUsers = data.data || data.users || data || [];
      const users: User[] = Array.isArray(rawUsers)
        ? rawUsers.map(normalizeUser)
        : (rawUsers.items || []).map(normalizeUser);

      const total = data.total || rawUsers.total || users.length;

      return { users, total };
    } catch (error: any) {
      console.error("❌ listUsers error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Không thể tải danh sách người dùng"
      );
    }
  },

  /**
   * 📄 Lấy chi tiết user theo ID
   * API: GET /users/:id
   */
  async getDetail(id: string): Promise<User> {
    try {
      const { data } = await api.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return normalizeUser(data.data || data);
    } catch (error: any) {
      console.error("❌ getDetail error:", error);
      throw new Error(
        error.response?.data?.message || "Không thể tải chi tiết người dùng"
      );
    }
  },

  /**
   * ✏️ Cập nhật thông tin user
   * API: PUT /users/:id
   */
  async update(id: string, payload: Partial<User>): Promise<User> {
    try {
      const { data } = await api.put(`/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return normalizeUser(data.data || data);
    } catch (error: any) {
      console.error("❌ updateUser error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Không thể cập nhật thông tin người dùng"
      );
    }
  },

  /**
   * 🗑️ Xóa user
   * API: DELETE /users/:id
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const { data } = await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return { message: data.message || "Đã xóa người dùng thành công" };
    } catch (error: any) {
      console.error("❌ deleteUser error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Không thể xóa người dùng"
      );
    }
  },
};
