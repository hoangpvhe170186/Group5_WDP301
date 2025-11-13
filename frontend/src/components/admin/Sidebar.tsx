// src/components/admin/Sidebar.tsx
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  MessageSquare,
  LogOut,
  X,
} from "lucide-react";
import { clearAuthData } from "@/lib/auth";

type AdminSection =
  | "dashboard"
  | "orders"
  | "carriers"
  | "sellers"
  | "users"
  | "feedback"
  | "finance"
  | "vehicles"
  | "driver-applications";

interface SidebarProps {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { id: "dashboard" as AdminSection, label: "Tổng quan", icon: LayoutDashboard },
  { id: "orders" as AdminSection, label: "Quản lý đơn hàng", icon: Package },
  { id: "users" as AdminSection, label: "Quản lý khách hàng", icon: Users },
  { id: "carriers" as AdminSection, label: "Quản lý tài xế", icon: Users },
  { 
    id: "driver-applications" as AdminSection, 
    label: "Hồ sơ ứng viên", 
    icon: Users 
  },
  { id: "feedback" as AdminSection, label: "Quản lý phản hồi", icon: MessageSquare }
];

export default function Sidebar({ 
  activeSection, 
  setActiveSection, 
  sidebarOpen, 
  setSidebarOpen 
}: SidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleMenuClick = (id: AdminSection) => {
    setActiveSection(id);
    setSearchParams({ tab: id });
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/auth/login";
  };

  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-colors group ${
                  isActive
                    ? "bg-orange-100 text-orange-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-orange-700" : "text-gray-500"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-8 bg-orange-700 rounded-l-full" />
                )}
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
    </>
  );
}
