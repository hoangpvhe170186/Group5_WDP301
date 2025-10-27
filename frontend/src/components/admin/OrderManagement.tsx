"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { adminApi, type Order as OrderType } from "@/services/admin.service";
import { useNavigate } from "react-router-dom";

export default function OrderManagement() {
  // 🧠 State
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "processing" | "shipping" | "delivered" | "cancelled">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10; // Số lượng đơn hàng mỗi trang
  const navigate = useNavigate();

  // 🚀 Fetch dữ liệu đơn hàng từ API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getOrders(currentPage, limit);
        console.log(response);
        setOrders(response.orders);
        setTotalPages(response.totalPages);
        setTotalOrders(response.total);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải danh sách đơn hàng:", err);
        setError(err.message || "Lỗi khi tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage]);

  // ⚙️ Hàm xử lý hành động
  const handleViewOrder = (orderId: string) => {
    // Giả sử có route chi tiết đơn hàng
    navigate(`/admin/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    // Giả sử có route chỉnh sửa đơn hàng
    navigate(`/admin/orders/edit/${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
      try {
        // TODO: Thêm API xóa đơn hàng trong adminApi nếu cần
        // await adminApi.deleteOrder(orderId);
        setOrders(orders.filter((order) => order.id !== orderId));
        if (filteredOrders.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        setError("Lỗi khi xóa đơn hàng");
        console.error(err);
      }
    }
  };

  // ⚙️ Hàm render icon, màu và text cho trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipping":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipping":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "shipping":
        return "Đang giao";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // 🔍 Lọc dữ liệu theo tìm kiếm & trạng thái
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // 🧭 Loading & Error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Đang tải danh sách đơn hàng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 font-semibold mt-10">
        ❌ Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Download className="w-4 h-4" /> Xuất báo cáo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Mã</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Khách hàng</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Xe</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Lấy hàng</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Giao hàng</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Thời gian</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Giá</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Trạng thái</th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{order.code}</td>
                <td className="px-4 py-2">{order.customer?.full_name || "Khách hàng không xác định"}</td>
                <td className="px-4 py-2">{order.vehicleType || "Không xác định"}</td>
                <td className="px-4 py-2 truncate max-w-[140px]">{order.pickupAddress || "Không xác định"}</td>
                <td className="px-4 py-2 truncate max-w-[140px]">{order.deliveryAddress || "Không xác định"}</td>
                <td className="px-4 py-2">
                  <div>{order.createdAt}</div>
                  <div className="text-gray-500 text-xs">Giao: {order.deliveryDate || "Chưa xác định"}</div>
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  ₫{order.price.toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} <span className="ml-1">{getStatusText(order.status)}</span>
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditOrder(order.id)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
        <div className="text-sm text-gray-700">
          Hiển thị {filteredOrders.length} / {totalOrders} đơn hàng
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
}