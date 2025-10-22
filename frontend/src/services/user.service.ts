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
   * Interface mô tả cấu trúc dữ liệu User
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
   * 📘 Service xử lý các yêu cầu liên quan đến User
   */
  export const userApi = {
    /**
     * 🔍 Lấy danh sách tất cả user (Admin / Seller)
     * API: GET /users
     */
    async listUsers(): Promise<{ users: User[] }> {
      try {
        const { data } = await api.get("/users", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });

        // Chuẩn hóa dữ liệu trả về
        const rawUsers = data.data || data || [];
        const users: User[] = rawUsers.map((u: any) => ({
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
        }));

        return { users };
      } catch (error: any) {
        console.error("❌ listUsers error:", error.response?.data || error.message);
        throw new Error(
          error.response?.data?.message || "Không thể tải danh sách người dùng"
        );
      }
    },

    /**
     * 📄 Lấy chi tiết thông tin user theo ID
     * API: GET /users/:id
     */
    async getDetail(id: string): Promise<User> {
      try {
        const { data } = await api.get(`/users/${id}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });

        const u = data.data || data;
        return {
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
        };
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

        const u = data.data || data;
        return {
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
        };
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

    /**
     * 👩‍💼 Lấy danh sách Seller
     * API: GET /users/sellers
     */
    async listSellers(): Promise<{ users: User[] }> {
      try {
        const { data } = await api.get("/users/sellers", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const rawUsers = data.data || data || [];
        const users: User[] = rawUsers.map((u: any) => ({
          id: String(u._id),
          fullName: u.full_name || "",
          email: u.email || "",
          phone: u.phone || "",
          role: u.role || "Seller",
          status: u.status || "Active",
          createdAt: new Date(u.created_at).toLocaleString("vi-VN"),
          updatedAt: new Date(u.updated_at).toLocaleString("vi-VN"),
        }));
        return { users };
      } catch (error: any) {
        console.error("❌ listSellers error:", error.response?.data || error.message);
        throw new Error(
          error.response?.data?.message || "Không thể tải danh sách người bán"
        );
      }
    },

    /**
     * 🚚 Lấy danh sách tài xế
     * API: GET /users/drivers
     */
    async listDrivers(): Promise<{ users: User[] }> {
      try {
        const { data } = await api.get("/users/drivers", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const rawUsers = data.data || data || [];
        const users: User[] = rawUsers.map((u: any) => ({
          id: String(u._id),
          fullName: u.full_name || "",
          phone: u.phone || "",
          role: u.role || "Driver",
          status: u.status || "Active",
          createdAt: new Date(u.created_at).toLocaleString("vi-VN"),
          updatedAt: new Date(u.updated_at).toLocaleString("vi-VN"),
        }));
        return { users };
      } catch (error: any) {
        console.error("❌ listDrivers error:", error.response?.data || error.message);
        throw new Error(
          error.response?.data?.message || "Không thể tải danh sách tài xế"
        );
      }
    },

    /**
     * 🚛 Lấy danh sách Carrier (đơn vị vận chuyển)
     * API: GET /users/carriers
     */
    async listCarriers(): Promise<{ users: User[] }> {
      try {
        const { data } = await api.get("/users/carriers", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const rawUsers = data.data || data || [];
        const users: User[] = rawUsers.map((u: any) => ({
          id: String(u._id),
          fullName: u.full_name || "",
          phone: u.phone || "",
          role: u.role || "Carrier",
          status: u.status || "Active",
          createdAt: new Date(u.created_at).toLocaleString("vi-VN"),
          updatedAt: new Date(u.updated_at).toLocaleString("vi-VN"),
        }));
        return { users };
      } catch (error: any) {
        console.error("❌ listCarriers error:", error.response?.data || error.message);
        throw new Error(
          error.response?.data?.message ||
            "Không thể tải danh sách đơn vị vận chuyển"
        );
      }
    },
  };
