
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Truck,
  Star,
  Phone,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import { adminApi, type User as Driver } from "@/services/admin.service"; // Import adminApi
import { useNavigate } from "react-router-dom";

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehicleType: string;
  status: "active" | "inactive" | "banned";
  rating: number;
  totalTrips: number;
  completedTrips: number;
  joinDate: string;
  lastActive: string;
  earnings: number;
  vehicle?: {
    plate: string;
    model: string;
    year: number;
  };
  documents?: {
    license: string;
    insurance: string;
    inspection: string;
  };
}

type SortField = "fullName" | "rating" | "totalTrips" | "earnings" | "joinDate";
type SortOrder = "asc" | "desc";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [filterRating, setFilterRating] = useState<"all" | "high" | "medium" | "low">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("fullName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // 🚀 Fetch dữ liệu tài xế từ API
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getUsersByRole("drivers", currentPage, itemsPerPage);
        setDrivers(response.users);
        setTotalPages(response.totalPages);
        setTotalDrivers(response.total);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải danh sách tài xế:", err);
        setError(err.message || "Lỗi khi tải danh sách tài xế");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [currentPage]);

  // ⚙️ Hàm xử lý hành động
  const handleViewDriver = async (driverId: string) => {
    try {
      const driver = await adminApi.getUserDetail(driverId);
      navigate(`/admin/drivers/${driverId}`);
    } catch (err: any) {
      setError("Lỗi khi lấy chi tiết tài xế");
      console.error(err);
    }
  };

  const handleEditDriver = (driverId: string) => {
    navigate(`/admin/drivers/edit/${driverId}`);
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (window.confirm("Bạn có chắc muốn xóa tài xế này?")) {
      try {
        await adminApi.deleteUser(driverId);
        setDrivers(drivers.filter((driver) => driver.id !== driverId));
        if (filteredAndSortedDrivers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        setError("Lỗi khi xóa tài xế");
        console.error(err);
      }
    }
  };

  const toggleExpandRow = (driverId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(driverId)) {
      newExpanded.delete(driverId);
    } else {
      newExpanded.add(driverId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Không hoạt động";
      case "suspended":
        return "Bị khóa";
      default:
        return "Không xác định";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4" />;
      case "suspended":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.7) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredAndSortedDrivers = drivers
    .filter((driver) => {
      const matchesSearch =
        driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm);

      const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
      const matchesRating =
        filterRating === "all" ||
        (filterRating === "high" && driver.rating >= 4.5) ||
        (filterRating === "medium" && driver.rating >= 4.0 && driver.rating < 4.5) ||
        (filterRating === "low" && driver.rating < 4.0);

      return matchesSearch && matchesStatus && matchesRating;
    })
    .sort((a, b) => {
      const aValue: any = a[sortField];
      const bValue: any = b[sortField];

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDrivers = filteredAndSortedDrivers.slice(startIndex, startIndex + itemsPerPage);

  // 🧭 Loading & Error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Đang tải danh sách tài xế...
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý tài xế</h1>
        <button
          onClick={() => navigate("/admin/drivers/add")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm tài xế
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng tài xế</p>
              <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">
                {drivers.filter((d) => d.status === "active").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trung bình rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length || 0).toFixed(1)}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-blue-600">
                ₫{(drivers.reduce((sum, d) => sum + d.earnings, 0) / 1000000).toFixed(0)}M
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, SĐT, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Bị khóa</option>
            </select>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tất cả rating</option>
              <option value="high">Cao (≥4.5)</option>
              <option value="medium">Trung bình (4.0-4.5)</option>
              <option value="low">Thấp (&lt;4.0)</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-2">
                    Thông tin
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xe</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("rating")}
                >
                  <div className="flex items-center gap-2">
                    Rating
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("totalTrips")}
                >
                  <div className="flex items-center gap-2">
                    Chuyến
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("earnings")}
                >
                  <div className="flex items-center gap-2">
                    Doanh thu
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDrivers.map((driver) => (
                <tbody key={driver.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => toggleExpandRow(driver.id)} className="p-1 hover:bg-gray-200 rounded">
                        {expandedRows.has(driver.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{driver.fullName}</div>
                          <div className="text-sm text-gray-500">ID: {driver.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.vehicleType || "Không xác định"}</div>
                      <div className="text-sm text-gray-500">{driver.licenseNumber || "Không xác định"}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.completedTrips}/{driver.totalTrips}
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.totalTrips > 0
                          ? ((driver.completedTrips / driver.totalTrips) * 100).toFixed(0)
                          : 0}
                        % hoàn thành
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₫{(driver.earnings / 1000000).toFixed(1)}M
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          driver.status
                        )}`}
                      >
                        {getStatusIcon(driver.status)}
                        <span className="ml-1">{getStatusText(driver.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDriver(driver.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditDriver(driver.id)}
                          className="text-orange-600 hover:text-orange-900 p-1"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(driver.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Thông tin xe</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Biển số:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {driver.vehicle?.plate || "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Model:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {driver.vehicle?.model || "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Năm sản xuất:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {driver.vehicle?.year || "Không xác định"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Tài liệu</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Bằng lái:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {driver.documents?.license || "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Bảo hiểm:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {driver.documents?.insurance || "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Kiểm định:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {driver.documents?.inspection || "Không xác định"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalDrivers)} của{" "}
            {totalDrivers} tài xế
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === page ? "bg-orange-500 text-white" : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}