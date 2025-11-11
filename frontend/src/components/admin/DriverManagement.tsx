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
  Ban,
  User,
} from "lucide-react";
import { adminApi, type User as Carrier } from "@/services/admin.service";
import { useNavigate } from "react-router-dom";
import DriverDetail from "./DriverDetail";
import React from "react";

interface Carrier {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehiclePlate: string;
  status: "Active" | "Inactive" | "Banned";
  rating: number;
  totalTrips: number;
  completedTrips: number;
  joinDate: string;
  lastActive: string;
  earnings: number;
  commissionPaid: number;
  avatar?: string;
  banReason?: string;
  vehicle?: {
    plate: string;
    type: string;
    capacity: number;
    status: string;
  };
  currentOrders?: Array<{
    id: string;
    orderCode: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
  }>;
  reviews?: Array<{
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  reports?: Array<{
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

type SortField = "fullName" | "rating" | "totalTrips" | "earnings" | "joinDate";
type SortOrder = "asc" | "desc";

export default function DriverManagement() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Active" | "Inactive" | "Banned">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("fullName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCarriers, setTotalCarriers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [showCarrierDetail, setShowCarrierDetail] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [carrierToBan, setCarrierToBan] = useState<string | null>(null);
  
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // 🚀 Fetch dữ liệu carrier từ API
  useEffect(() => {
    const fetchCarriers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getUsersByRole("carriers", currentPage, itemsPerPage);
        
        // Transform data để thêm thông tin chi tiết
        const carriersWithDetails = await Promise.all(
          response.users.map(async (carrier) => {
            try {
              // Lấy thông tin chi tiết carrier
              const carrierDetail = await adminApi.getUserDetail(carrier.id);
              
              // Mock data cho các thông tin bổ sung (trong thực tế sẽ gọi API riêng)
              return {
                ...carrier,
                licenseNumber: carrierDetail.licenseNumber || "Chưa cập nhật",
                vehiclePlate: carrierDetail.vehiclePlate || "Chưa cập nhật",
                totalTrips: Math.floor(Math.random() * 100) + 50,
                completedTrips: Math.floor(Math.random() * 90) + 40,
                earnings: Math.floor(Math.random() * 50000000) + 10000000,
                commissionPaid: Math.floor(Math.random() * 10000000) + 1000000,
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
                joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                lastActive: new Date().toISOString(),
                vehicle: {
                  plate: carrierDetail.vehiclePlate || "29A-XXXXX",
                  type: "Truck",
                  capacity: 2500,
                  status: Math.random() > 0.3 ? "Available" : "In Use"
                },
                currentOrders: [
                  {
                    id: "ORD001",
                    orderCode: "ORD-001",
                    status: "ON_THE_WAY",
                    pickupAddress: "123 Nguyễn Huệ, Q1",
                    deliveryAddress: "456 Lê Lợi, Q1"
                  },
                  {
                    id: "ORD002",
                    orderCode: "ORD-002", 
                    status: "ASSIGNED",
                    pickupAddress: "789 Lý Tự Trọng, Q1",
                    deliveryAddress: "321 Hai Bà Trưng, Q3"
                  }
                ].slice(0, Math.floor(Math.random() * 2) + 1),
                reviews: [
                  {
                    rating: 5,
                    comment: "Rất tốt, giao hàng nhanh",
                    createdAt: "2024-01-15"
                  },
                  {
                    rating: 4,
                    comment: "Tốt, đúng giờ",
                    createdAt: "2024-01-10"
                  }
                ],
                reports: Math.random() > 0.7 ? [
                  {
                    type: "Delay",
                    description: "Giao hàng trễ 30 phút",
                    status: "Resolved",
                    createdAt: "2024-01-12"
                  }
                ] : []
              };
            } catch (err) {
              console.error(`Error fetching details for carrier ${carrier.id}:`, err);
              return {
                ...carrier,
                licenseNumber: "Lỗi tải",
                vehiclePlate: "Lỗi tải",
                totalTrips: 0,
                completedTrips: 0,
                earnings: 0,
                commissionPaid: 0,
                rating: 0,
                joinDate: "N/A",
                lastActive: "N/A"
              };
            }
          })
        );

        setCarriers(carriersWithDetails);
        setTotalPages(response.totalPages);
        setTotalCarriers(response.total);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải danh sách carrier:", err);
        setError(err.message || "Lỗi khi tải danh sách carrier");
      } finally {
        setLoading(false);
      }
    };

    fetchCarriers();
  }, [currentPage]);

  // ⚙️ Hàm xử lý hành động
  const handleViewCarrier = async (carrierId: string) => {
    try {
      setSelectedCarrierId(carrierId);
      setShowCarrierDetail(true);
    } catch (err: any) {
      setError("Lỗi khi lấy chi tiết carrier");
      console.error(err);
    }
  };

  const handleEditCarrier = (carrierId: string) => {
    navigate(`/admin/carriers/edit/${carrierId}`);
  };

  const handleDeleteCarrier = async (carrierId: string) => {
    if (window.confirm("Bạn có chắc muốn xóa carrier này?")) {
      try {
        await adminApi.deleteUser(carrierId);
        setCarriers(carriers.filter((carrier) => carrier.id !== carrierId));
        if (filteredAndSortedCarriers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        setError("Lỗi khi xóa carrier");
        console.error(err);
      }
    }
  };

  const handleBanCarrier = (carrierId: string) => {
    setCarrierToBan(carrierId);
    setShowBanModal(true);
  };

  const confirmBanCarrier = async () => {
    if (!carrierToBan || !banReason.trim()) return;

    try {
      await adminApi.updateUser(carrierToBan, {
        status: "Banned",
        banReason: banReason.trim()
      });
      
      setCarriers(carriers.map(carrier => 
        carrier.id === carrierToBan 
          ? { ...carrier, status: "Banned", banReason: banReason.trim() }
          : carrier
      ));
      
      setShowBanModal(false);
      setBanReason("");
      setCarrierToBan(null);
    } catch (err: any) {
      setError("Lỗi khi khóa carrier");
      console.error(err);
    }
  };

  const handleUnbanCarrier = async (carrierId: string) => {
    try {
      await adminApi.updateUser(carrierId, {
        status: "Active",
        banReason: ""
      });
      
      setCarriers(carriers.map(carrier => 
        carrier.id === carrierId 
          ? { ...carrier, status: "Active", banReason: "" }
          : carrier
      ));
    } catch (err: any) {
      setError("Lỗi khi mở khóa carrier");
      console.error(err);
    }
  };

  const handleBackFromDetail = () => {
    setShowCarrierDetail(false);
    setSelectedCarrierId(null);
  };

  const toggleExpandRow = (carrierId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(carrierId)) {
      newExpanded.delete(carrierId);
    } else {
      newExpanded.add(carrierId);
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
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Banned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Active":
        return "Hoạt động";
      case "Inactive":
        return "Không hoạt động";
      case "Banned":
        return "Bị khóa";
      default:
        return "Không xác định";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="w-4 h-4" />;
      case "Inactive":
        return <AlertCircle className="w-4 h-4" />;
      case "Banned":
        return <Ban className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "ON_THE_WAY":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "ON_THE_WAY":
        return "Đang giao";
      case "ASSIGNED":
        return "Đã phân công";
      case "DELIVERED":
        return "Đã giao";
      default:
        return status;
    }
  };

  const filteredAndSortedCarriers = carriers
    .filter((carrier) => {
      const matchesSearch =
        carrier.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.phone.includes(searchTerm) ||
        carrier.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || carrier.status === filterStatus;

      return matchesSearch && matchesStatus;
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
  const paginatedCarriers = filteredAndSortedCarriers.slice(startIndex, startIndex + itemsPerPage);

  // 🧭 Loading & Error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Đang tải danh sách carrier...
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

  // Nếu đang hiển thị chi tiết carrier
  if (showCarrierDetail) {
    return <DriverDetail carrierId={selectedCarrierId || undefined} onBack={handleBackFromDetail} />;
  }

  return (
    <div className="space-y-6">
      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Khóa Carrier</h3>
            <p className="text-gray-600 mb-4">Vui lòng nhập lý do khóa carrier:</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do khóa..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmBanCarrier}
                disabled={!banReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
              >
                Xác nhận khóa
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setCarrierToBan(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Thông tin tài xế</h1>
        <button
          onClick={() => navigate("/admin/carriers/add")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm carrier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng carrier</p>
              <p className="text-2xl font-bold text-gray-900">{totalCarriers}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">
                {carriers.filter((d) => d.status === "Active").length}
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
                {(carriers.reduce((sum, d) => sum + d.rating, 0) / carriers.length || 0).toFixed(1)}
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
                ₫{(carriers.reduce((sum, d) => sum + d.earnings, 0) / 1000000).toFixed(0)}M
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
                placeholder="Tìm kiếm theo tên, email, SĐT, ID, biển số xe..."
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
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Không hoạt động</option>
              <option value="Banned">Bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Carriers Table */}
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
                    Thông tin carrier
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ & Xe</th>
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
                    Doanh thu & Hoa hồng
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCarriers.map((carrier) => (
                  <React.Fragment key={carrier.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => toggleExpandRow(carrier.id)} className="p-1 hover:bg-gray-200 rounded">
                        {expandedRows.has(carrier.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          {carrier.avatar ? (
                            <img src={carrier.avatar} alt={carrier.fullName} className="h-10 w-10 rounded-full" />
                          ) : (
                            <User className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{carrier.fullName}</div>
                          <div className="text-sm text-gray-500">ID: {carrier.id}</div>
                          <div className="text-sm text-gray-500">GPLX: {carrier.licenseNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {carrier.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {carrier.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Truck className="w-4 h-4 mr-2 text-gray-400" />
                          {carrier.vehiclePlate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-gray-900">{carrier.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {carrier.reviews?.length || 0} đánh giá
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {carrier.completedTrips}/{carrier.totalTrips}
                      </div>
                      <div className="text-xs text-gray-500">
                        {carrier.totalTrips > 0
                          ? ((carrier.completedTrips / carrier.totalTrips) * 100).toFixed(0)
                          : 0}% hoàn thành
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₫{(carrier.earnings / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-gray-500">
                        Đã trả: ₫{(carrier.commissionPaid / 1000000).toFixed(1)}M
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          carrier.status
                        )}`}
                      >
                        {getStatusIcon(carrier.status)}
                        <span className="ml-1">{getStatusText(carrier.status)}</span>
                      </span>
                      {carrier.banReason && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={carrier.banReason}>
                          {carrier.banReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewCarrier(carrier.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {carrier.status === "Banned" ? (
                          <button
                            onClick={() => handleUnbanCarrier(carrier.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Mở khóa"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanCarrier(carrier.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Khóa tài khoản"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(carrier.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Thông tin xe */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Thông tin xe</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Biển số:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {carrier.vehicle?.plate || "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Loại xe:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {carrier.vehicle?.type || "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Tải trọng:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {carrier.vehicle?.capacity ? `${carrier.vehicle.capacity}kg` : "Không xác định"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Trạng thái xe:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {carrier.vehicle?.status === "Available" ? "Sẵn sàng" : "Đang sử dụng"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Đơn hàng hiện tại */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Đơn hàng hiện tại</h4>
                            <div className="space-y-2">
                              {carrier.currentOrders && carrier.currentOrders.length > 0 ? (
                                carrier.currentOrders.map((order) => (
                                  <div key={order.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <div>
                                      <div className="font-medium text-gray-900">{order.orderCode}</div>
                                      <div className="text-xs text-gray-500 truncate max-w-xs">
                                        {order.pickupAddress} → {order.deliveryAddress}
                                      </div>
                                    </div>
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(
                                        order.status
                                      )}`}
                                    >
                                      {getOrderStatusText(order.status)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500">Không có đơn hàng nào</div>
                              )}
                            </div>
                          </div>

                          {/* Đánh giá & Report */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Đánh giá & Báo cáo</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Số đánh giá:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {carrier.reviews?.length || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Số báo cáo:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {carrier.reports?.length || 0}
                                </span>
                              </div>
                              {carrier.reports && carrier.reports.length > 0 && (
                                <div>
                                  <span className="text-gray-600">Báo cáo gần nhất:</span>
                                  <div className="ml-2 text-red-600 text-xs">
                                    {carrier.reports[0].type} - {carrier.reports[0].status}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tài chính */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Tài chính</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tổng doanh thu:</span>
                                <span className="font-medium text-gray-900">
                                  ₫{(carrier.earnings / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hoa hồng đã trả:</span>
                                <span className="font-medium text-green-600">
                                  ₫{(carrier.commissionPaid / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Còn lại:</span>
                                <span className="font-medium text-blue-600">
                                  ₫{((carrier.earnings - carrier.commissionPaid) / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tỷ lệ hoa hồng:</span>
                                <span className="font-medium text-gray-900">20%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCarriers)} của{" "}
            {totalCarriers} carrier
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