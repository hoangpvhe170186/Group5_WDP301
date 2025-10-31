// src/pages/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { getCurrentUserRole } from "@/lib/auth";
import { adminApi } from "@/services/admin.service";

// Import components
import Sidebar from "@/components/admin/Sidebar";
import OrderManagement from "@/components/admin/OrderManagement";
import CustomerManagement from "@/components/admin/CustomerManagement";
import ComplaintManagement from "@/components/admin/ComplaintManagement";
import QualityManagement from "@/components/admin/QualityManagement";
import DriverManagement from "@/components/admin/DriverManagement";

type AdminSection = "dashboard" | "orders" | "drivers" | "sellers" | "users" | "complaints" | "quality" | "finance" | "vehicles";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Đọc tab từ URL khi load
  useEffect(() => {
    const tab = searchParams.get("tab") as AdminSection;
    if (tab && ["dashboard", "orders", "users", "drivers", "complaints", "quality"].includes(tab)) {
      setActiveSection(tab);
    } else if (!searchParams.get("tab")) {
      setSearchParams({ tab: "dashboard" });
    }
  }, [searchParams, setSearchParams]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "orders":
        return <OrderManagement />;
      case "users":
        return <CustomerManagement />;
      case "drivers":
        return <DriverManagement />;
      case "complaints":
        return <ComplaintManagement />;
      case "quality":
        return <QualityManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {getCurrentUserRole() || "Admin"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// === DashboardOverview giữ nguyên ===
function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const stats = await adminApi.getDashboard();
        const totalUsers = stats.totalCustomers + stats.totalDrivers + stats.totalSellers;

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
        const revenueData = await adminApi.getRevenueStats(startOfMonth, endOfMonth);

        let monthlyRevenue = 0;
        if (revenueData && Array.isArray(revenueData)) {
          monthlyRevenue = revenueData.reduce((sum: number, day: any) => sum + day.totalRevenue, 0);
        } else {
          monthlyRevenue = stats.totalRevenue;
        }

        const complaints = 0;

        setDashboardData({ totalOrders: stats.totalOrders, totalUsers, complaints, monthlyRevenue });

        const ordersResponse = await adminApi.getOrders(1, 3);
        setRecentOrders(ordersResponse.orders.map((order: any) => ({
          id: order.code || `#${order.id}`,
          customer: order.customer?.full_name || 'Khách hàng không xác định',
          amount: `₫${order.price.toLocaleString()}`,
          status: order.status,
        })));
      } catch (err) {
        setError('Lỗi khi tải dữ liệu dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

  const stats = [
    { label: "Tổng đơn hàng", value: dashboardData.totalOrders.toLocaleString(), change: "+12%", color: "blue" },
    { label: "Tài khoản người dùng", value: dashboardData.totalUsers.toLocaleString(), change: "+8%", color: "green" },
    { label: "Khiếu nại", value: dashboardData.complaints.toLocaleString(), change: "-5%", color: "red" },
    { label: "Doanh thu tháng", value: `₫${dashboardData.monthlyRevenue.toLocaleString()}`, change: "+15%", color: "orange" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <div className={`w-6 h-6 bg-${stat.color}-500 rounded`} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">so với tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                      order.status === 'Đang giao' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
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
  );
}