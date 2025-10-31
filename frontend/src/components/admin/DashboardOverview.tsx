"use client"

import { useState } from "react"
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
} from "recharts"
import { TrendingUp, TrendingDown, Package, Users, MessageSquare, DollarSign } from "lucide-react"

const revenueData = [
  { month: "T1", revenue: 32000000, target: 35000000 },
  { month: "T2", revenue: 38000000, target: 35000000 },
  { month: "T3", revenue: 42000000, target: 40000000 },
  { month: "T4", revenue: 45000000, target: 45000000 },
  { month: "T5", revenue: 48000000, target: 50000000 },
  { month: "T6", revenue: 52000000, target: 50000000 },
]

const orderStatusData = [
  { name: "Hoàn thành", value: 1050, color: "#10b981" },
  { name: "Đang giao", value: 234, color: "#f59e0b" },
  { name: "Chờ xử lý", value: 89, color: "#3b82f6" },
  { name: "Đã hủy", value: 23, color: "#ef4444" },
]

const driverPerformanceData = [
  { name: "Tài xế A", trips: 45, rating: 4.8, earnings: 12500000 },
  { name: "Tài xế B", trips: 38, rating: 4.5, earnings: 10200000 },
  { name: "Tài xế C", trips: 52, rating: 4.9, earnings: 14800000 },
  { name: "Tài xế D", trips: 31, rating: 4.2, earnings: 8900000 },
  { name: "Tài xế E", trips: 42, rating: 4.6, earnings: 11500000 },
]

export default function DashboardOverview() {
  const [timeRange, setTimeRange] = useState("month")

  const stats = [
    {
      label: "Tổng đơn hàng",
      value: "1,396",
      change: "+12%",
      trend: "up",
      color: "blue",
      icon: Package,
    },
    {
      label: "Tài khoản người dùng",
      value: "5,678",
      change: "+8%",
      trend: "up",
      color: "green",
      icon: Users,
    },
    {
      label: "Khiếu nại",
      value: "23",
      change: "-5%",
      trend: "down",
      color: "red",
      icon: MessageSquare,
    },
    {
      label: "Doanh thu tháng",
      value: "₫52M",
      change: "+15%",
      trend: "up",
      color: "orange",
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "week"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "month"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "year"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Năm
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.trend === "up"
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500">so với tháng trước</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Doanh thu theo tháng</h2>
            <p className="text-sm text-gray-500">So sánh doanh thu thực tế với mục tiêu</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Trạng thái đơn hàng</h2>
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Driver Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hiệu suất tài xế</h2>
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
            <Bar dataKey="trips" fill="#f97316" name="Số chuyến" radius={[8, 8, 0, 0]} />
            <Bar dataKey="rating" fill="#10b981" name="Rating (x10)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { id: "#1234", customer: "Nguyễn Văn A", amount: "₫150,000", status: "Đang giao" },
                { id: "#1235", customer: "Trần Thị B", amount: "₫200,000", status: "Hoàn thành" },
                { id: "#1236", customer: "Lê Văn C", amount: "₫300,000", status: "Đang xử lý" },
              ].map((order, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
