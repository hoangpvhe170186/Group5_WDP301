// src/services/order.service.ts
import api from "@/lib/axios";
import axios from "../lib/axios";

/**
 * Lấy token xác thực từ localStorage / sessionStorage
 */
export const getAuthToken = (): string => {
  if (typeof window === "undefined") {
    // Code đang chạy ở server-side (Next.js SSR)
    return "";
  }

  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("auth_token") ||
    "";

  return token;
};


export interface Order {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  totalPrice: number;
  status: string;
  scheduledTime: string;
  vehicleId?: string;
  driverId?: string;
  carrierId?: string;
}
export default {
  acceptOrder: (orderId: string) => axios.post(`/orders/${orderId}/carrier-accept`),
  sellerAccept: (orderId: string) => axios.post(`/orders/${orderId}/seller-accept`),
  assignOrder: (orderId: string, carrierId: string) => axios.post(`/orders/${orderId}/assign`, { carrierId }),
  declineAssignment: (orderId: string) => axios.post(`/orders/${orderId}/decline`)
};
/**
 * Service xử lý các yêu cầu liên quan đến đơn hàng
 */
export const orderApi = {
  /**
   * 📦 Lấy danh sách tất cả đơn hàng của user hiện tại
   * API: GET /orders/myorder
   */
  async listMyOrders(): Promise<{ orders: Order[] }> {
    try {
      const { data } = await api.get("/orders/myorder", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      console.log("Dữ liệu thô từ API:", data);
      const rawOrders = data.data || []; // Lấy mảng từ data.data
      console.log("Mảng rawOrders:", rawOrders);
      const orders: Order[] = rawOrders.map((o: any) => ({
        id: String(o._id),
        pickupAddress: o.pickup_address || "",
        deliveryAddress: o.delivery_address || "",
        totalPrice: Number(o.total_price || 0),
        phone : o.phone,
        status: o.status || "Pending",
        scheduledTime: o.scheduled_time
          ? new Date(o.scheduled_time).toLocaleString("vi-VN")
          : "Chưa có thời gian",
        vehicleId: o.vehicle_id,
        driverId: o.driver_id,
        carrierId: o.carrier_id,
      }));

      console.log("Danh sách đơn hàng:", orders); 
      return { orders };
    } catch (error: any) {
      console.error(
        "❌ listMyOrders error:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Không thể tải danh sách đơn hàng"
      );
    }
  },

  /**
   * 🔍 Lấy chi tiết 1 đơn hàng theo ID
   * API: GET /orders/:id
   */
  async getDetail(id: string): Promise<Order> {
    try {
      const { data } = await api.get(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      return {
        id: String(data._id),
        pickupAddress: data.pickup_address || "",
        deliveryAddress: data.delivery_address || "",
        totalPrice: Number(data.total_price || 0),
        status: data.status || "Pending",
        scheduledTime: data.scheduled_time
          ? new Date(data.scheduled_time).toLocaleString("vi-VN")
          : "Chưa có thời gian",
        vehicleId: data.vehicle_id,
        driverId: data.driver_id,
        carrierId: data.carrier_id,
      };
    } catch (error: any) {
      console.error("❌ getDetail error:", error);
      throw new Error(
        error.response?.data?.message || "Không thể tải chi tiết đơn hàng"
      );
    }
  },
};
