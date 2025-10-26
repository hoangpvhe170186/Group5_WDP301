import api from "@/lib/axios";
import { getAuthToken } from "./user.service";

export interface DashboardStats {
  totalCustomers: number;
  totalDrivers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByTime: { date: string; count: number }[];
  revenueByTime: { date: string; total: number }[];
}

export const dashboardApi = {
  async getOverview(): Promise<DashboardStats> {
    const { data } = await api.get("/dashboard/overview", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data;
  },
};
