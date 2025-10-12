import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  MessageSquare, 
  Star, 
  DollarSign, 
  Truck,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAuthData, getCurrentUserRole } from "../lib/auth";

// Import các component quản lý
import OrderManagement from "../components/admin/OrderManagement";
import UserManagement from "../components/admin/UserManagement";
import ComplaintManagement from "../components/admin/ComplaintManagement";
import QualityManagement from "../components/admin/QualityManagement";
import FinancialManagement from "../components/admin/FinancialManagement";
// import VehicleManagement from "../components/admin/VehicleManagement";

type AdminSection = 
  | "dashboard" 
  | "orders" 
  | "users" 
  | "complaints" 
  | "quality" 
  | "finance" 
  | "vehicles";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard" as AdminSection, label: "Tổng quan", icon: LayoutDashboard },
    { id: "orders" as AdminSection, label: "Quản lý đơn hàng", icon: Package },
    { id: "users" as AdminSection, label: "Quản lý tài khoản", icon: Users },
    { id: "complaints" as AdminSection, label: "Xử lý khiếu nại", icon: MessageSquare },
    { id: "quality" as AdminSection, label: "Quản lý chất lượng", icon: Star },
    { id: "finance" as AdminSection, label: "Quản lý tài chính", icon: DollarSign },
    { id: "vehicles" as AdminSection, label: "Quản lý xe", icon: Truck },
  ];

  const handleLogout = () => {
    clearAuthData();
    navigate("/auth/login");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "orders":
        return <OrderManagement />;
      case "users":
        return <UserManagement />;
      case "complaints":
        return <ComplaintManagement />;
      case "quality":
        return <QualityManagement />;
      case "finance":
        return <FinancialManagement />;
      // case "vehicles":
      //   return <VehicleManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
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
                  {getCurrentUserRole()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Component tổng quan dashboard
function DashboardOverview() {
  const stats = [
    { label: "Tổng đơn hàng", value: "1,234", change: "+12%", color: "blue" },
    { label: "Tài khoản người dùng", value: "5,678", change: "+8%", color: "green" },
    { label: "Khiếu nại", value: "23", change: "-5%", color: "red" },
    { label: "Doanh thu tháng", value: "₫45.6M", change: "+15%", color: "orange" },
  ];

  const recentOrders = [
    { id: "#1234", customer: "Nguyễn Văn A", amount: "₫150,000", status: "Đang giao" },
    { id: "#1235", customer: "Trần Thị B", amount: "₫200,000", status: "Hoàn thành" },
    { id: "#1236", customer: "Lê Văn C", amount: "₫300,000", status: "Đang xử lý" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
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
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">so với tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order, index) => (
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'Hoàn thành' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Đang giao'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
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
