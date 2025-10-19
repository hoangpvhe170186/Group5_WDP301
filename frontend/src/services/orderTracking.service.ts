import api from "@/lib/axios";

export const orderTrackingApi = {
  async getTracking(orderId: string) {
    const res = await api.get(`/order-tracking/${orderId}`);
    return res.data;
  },
};
