"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { adminApi } from "@/services/admin.service";

export default function DashboardOverview() {
  const [timeRange, setTimeRange] = useState("month");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [driverPerformanceData, setDriverPerformanceData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Lấy thống kê tổng quan
        const stats = await adminApi.getDashboard();
        const totalUsers =
          stats.totalCustomers + stats.totalDrivers + stats.totalSellers;

        // 2️⃣ Lấy doanh thu theo khoảng thời gian
        const currentDate = new Date();
        let startDate, endDate;

        if (timeRange === "week") {
          startDate = new Date(currentDate);
          startDate.setDate(startDate.getDate() - 7);
          endDate = currentDate;
        } else if (timeRange === "month") {
          startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
          );
          endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
          );
        } else {
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          endDate = new Date(currentDate.getFullYear(), 11, 31);
        }

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];
        const revenueStats = await adminApi.getRevenueStats(
          startDateStr,
          endDateStr
        );

        // 3️⃣ Chuẩn hóa dữ liệu doanh thu (LineChart)
        const formattedRevenueData = (revenueStats || []).map((item) => {
          const date = new Date(item.date);
          const label =
            timeRange === "week"
              ? date.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })
              : timeRange === "month"
              ? date.getDate().toString()
              : `T${date.getMonth() + 1}`;

          return {
            month: label,
            revenue: item.totalRevenue || 0,
            target: Math.round((item.totalRevenue || 0) * 1.1),
          };
        });
        setRevenueData(formattedRevenueData);

        // 4️⃣ Lấy đơn hàng gần đây
        const ordersResponse = await adminApi.getOrders(1, 5);
        setRecentOrders(
          ordersResponse.orders.map((order) => ({
            id: order.code || `#${order.id}`,
            customer: order.customer?.fullName || "Khách hàng không xác định",
            amount: `₫${order.price.toLocaleString()}`,
            status: order.status,
          }))
        );

        // 5️⃣ Lấy thống kê trạng thái đơn hàng (PieChart)
        const orderStatusStats = await adminApi.getOrderStatusStats();
        const formattedOrderStatus = [
          {
            name: "Hoàn thành",
            value: orderStatusStats.completed || 0,
            color: "#10b981",
          },
          {
            name: "Chờ xử lý",
            value: orderStatusStats.pending || 0,
            color: "#3b82f6",
          },
          {
            name: "Đã hủy",
            value: orderStatusStats.cancelled || 0,
            color: "#ef4444",
          },
        ];
        setOrderStatusData(formattedOrderStatus);

        // 6️⃣ Lấy hiệu suất tài xế (BarChart)
        const driverPerformance = await adminApi.getDriverPerformance(5);
        const formattedDrivers = driverPerformance.map((d) => ({
          name: d.name,
          trips: d.trips || d.totalOrders || 0,
          rating: d.rating || 0,
        }));
        setDriverPerformanceData(formattedDrivers);

        // 7️⃣ Lưu tổng kết chung
        setDashboardStats({
          totalOrders: stats.totalOrders,
          totalUsers,
          complaints: stats.totalComplaints ?? 0,
          monthlyRevenue: stats.totalRevenue,
        });
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
        setError("Lỗi khi tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-700">Đang tải dữ liệu...</span>
      </div>
    );

  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;

  if (!dashboardStats)
    return <div className="text-center py-10">Không có dữ liệu</div>;

  // Danh sách thống kê nhanh
  const stats = [
    {
      label: "Tổng đơn hàng",
      value: dashboardStats.totalOrders.toLocaleString(),
      change: "+12%",
      trend: "up",
      color: "blue",
      icon: Package,
    },
    {
      label: "Tài khoản người dùng",
      value: dashboardStats.totalUsers.toLocaleString(),
      change: "+8%",
      trend: "up",
      color: "green",
      icon: Users,
    },
    {
      label: "Khiếu nại",
      value: dashboardStats.complaints.toLocaleString(),
      change: "-5%",
      trend: "down",
      color: "red",
      icon: MessageSquare,
    },
    {
      label: "Doanh thu tháng",
      value: `₫${(dashboardStats.monthlyRevenue / 1000000).toFixed(1)}M`,
      change: "+15%",
      trend: "up",
      color: "orange",
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <div className="flex gap-2">
          {["week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {range === "week"
                ? "Tuần"
                : range === "month"
                ? "Tháng"
                : "Năm"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === "up";
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500">
                  so với tháng trước
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Doanh thu theo{" "}
              {timeRange === "week"
                ? "ngày"
                : timeRange === "month"
                ? "ngày trong tháng"
                : "tháng"}
            </h2>
            <p className="text-sm text-gray-500">
              So sánh doanh thu thực tế với mục tiêu
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => [
                  `₫${value.toLocaleString()}`,
                  undefined,
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: "#f97316", r: 4 }}
                name="Doanh thu thực tế"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Mục tiêu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Trạng thái đơn hàng
            </h2>
            <p className="text-sm text-gray-500">Phân bố đơn hàng hiện tại</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [value.toLocaleString(), undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Carrier Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Hiệu suất tài xế
          </h2>
          <p className="text-sm text-gray-500">Top 5 tài xế theo số chuyến</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={driverPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="trips"
              fill="#f97316"
              name="Số chuyến"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="rating"
              fill="#10b981"
              name="Rating"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Đơn hàng gần đây
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "Hoàn thành"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Đang giao"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
