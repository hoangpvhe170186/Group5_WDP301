import { useState } from "react";
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
  AlertCircle
} from "lucide-react";

export default function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const orders = [
    {
      id: "#ORD001",
      customer: "Nguyễn Văn A",
      vehicleType: "Xe tải nhỏ",
      pickupAddress: "123 Nguyễn Trãi, Hà Nội",
      deliveryAddress: "45 Lý Thường Kiệt, Hà Nội",
      amount: 1500000,
      status: "pending",
      createdAt: "2024-01-15 10:30",
      deliveryDate: "2024-01-20"
    },
    {
      id: "#ORD002",
      customer: "Trần Thị B",
      vehicleType: "Xe bán tải",
      pickupAddress: "56 Trần Phú, Hà Nội",
      deliveryAddress: "78 Nguyễn Văn Cừ, Hà Nội",
      amount: 2300000,
      status: "processing",
      createdAt: "2024-01-14 14:20",
      deliveryDate: "2024-01-19"
    },
    {
      id: "#ORD003",
      customer: "Lê Văn C",
      vehicleType: "Xe container",
      pickupAddress: "12 Giải Phóng, Hà Nội",
      deliveryAddress: "24 Hoàng Hoa Thám, Hà Nội",
      amount: 800000,
      status: "shipping",
      createdAt: "2024-01-13 09:15",
      deliveryDate: "2024-01-18"
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "processing": return <Package className="w-4 h-4" />;
      case "shipping": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipping": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "processing": return "Đang xử lý";
      case "shipping": return "Đang giao";
      case "delivered": return "Đã giao";
      case "cancelled": return "Đã hủy";
      default: return "Không xác định";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
              onChange={(e) => setFilterStatus(e.target.value)}
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
            {filteredOrders.map((order, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2">{order.id}</td>
                <td className="px-4 py-2">{order.customer}</td>
                <td className="px-4 py-2">{order.vehicleType}</td>
                <td className="px-4 py-2 truncate max-w-[140px]">{order.pickupAddress}</td>
                <td className="px-4 py-2 truncate max-w-[140px]">{order.deliveryAddress}</td>
                <td className="px-4 py-2">
                  <div>{order.createdAt}</div>
                  <div className="text-gray-500 text-xs">Giao: {order.deliveryDate}</div>
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  ₫{order.amount.toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} <span className="ml-1">{getStatusText(order.status)}</span>
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4" /></button>
                    <button className="text-orange-600 hover:text-orange-900"><Edit className="w-4 h-4" /></button>
                    <button className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
