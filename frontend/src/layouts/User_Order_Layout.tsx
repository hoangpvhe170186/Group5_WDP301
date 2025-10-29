import { Outlet, useNavigate, useLocation } from "react-router-dom";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import { Package, History, MessageCircle } from "lucide-react";

export default function UserOrderLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: "tracking",
      label: "Đơn hàng đang giao",
      icon: Package,
      path: "/myorder/tracking",
    },
    {
      id: "history",
      label: "Lịch sử đơn hàng",
      icon: History,
      path: "/myorder/history",
    },
    {
      id: "messages",
      label: "Tin nhắn",
      icon: MessageCircle,
      path: "/myorder/messages",
    },
  ];

  const activeTab = tabs.find((tab) => location.pathname === tab.path)?.id || "tracking";

  return (
    <>
      <HomeHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
            <p className="text-gray-600 mt-1">
              Theo dõi và quản lý đơn hàng của bạn
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(tab.path)}
                      className={`
                        flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition
                        ${
                          isActive
                            ? "border-orange-500 text-orange-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Outlet />
          </div>
        </div>
      </div>
      <HomeFooter />
    </>
  );
}