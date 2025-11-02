// src/pages/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { getCurrentUserRole } from "@/lib/auth";
import { adminApi } from "@/services/admin.service";

// Import components
import Sidebar from "@/components/admin/Sidebar";
import OrderManagement from "@/components/admin/OrderManagement";
import DashboardOverview from "@/components/admin/DashboardOverview";
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


