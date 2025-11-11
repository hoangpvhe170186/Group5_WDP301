// src/components/admin/CustomerManagement.tsx
import { Fragment, useEffect, useState } from "react";
import {
  Search,
  User,
  UserCheck,
  UserX,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  adminApi,
  type User as UserType,
  type Order as AdminOrder,
} from "@/services/admin.service";

interface CustomerOrderState {
  orders: AdminOrder[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error?: string;
}

const ORDER_PAGE_SIZE = 5;

export default function CustomerManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Active" | "Inactive" | "Banned"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [orderStates, setOrderStates] = useState<Record<string, CustomerOrderState>>({});
  const [showBanModal, setShowBanModal] = useState(false);
  const [customerToBan, setCustomerToBan] = useState<UserType | null>(null);
  const [banReason, setBanReason] = useState("");
  const limit = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getUsersByRole(
          "customers",
          currentPage,
          limit
        );
        setUsers(response.users);
        setTotalPages(response.totalPages);
        setTotalUsers(response.total);
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách khách hàng:", err);
        setError(err.message || "Lỗi khi tải danh sách khách hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  const fetchCustomerOrders = async (customerId: string, page = 1) => {
    setOrderStates((prev) => ({
      ...prev,
      [customerId]: {
        orders: prev[customerId]?.orders || [],
        total: prev[customerId]?.total || 0,
        totalPages: prev[customerId]?.totalPages || 1,
        currentPage: page,
        loading: true,
      },
    }));

    try {
      const response = await adminApi.getCustomerOrders(
        customerId,
        page,
        ORDER_PAGE_SIZE
      );

      setOrderStates((prev) => ({
        ...prev,
        [customerId]: {
          orders: response.orders,
          total: response.total,
          totalPages: response.totalPages,
          currentPage: response.currentPage,
          loading: false,
          error: undefined,
        },
      }));
    } catch (err: any) {
      setOrderStates((prev) => ({
        ...prev,
        [customerId]: {
          orders: prev[customerId]?.orders || [],
          total: prev[customerId]?.total || 0,
          totalPages: prev[customerId]?.totalPages || 1,
          currentPage: prev[customerId]?.currentPage || page,
          loading: false,
          error: err.message || "Không thể tải danh sách đơn",
        },
      }));
    }
  };

  const toggleExpandRow = (customerId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
        if (!orderStates[customerId]) {
          fetchCustomerOrders(customerId);
        }
      }
      return next;
    });
  };

  const handleBanCustomer = (user: UserType) => {
    setCustomerToBan(user);
    setBanReason("");
    setActionError(null);
    setShowBanModal(true);
  };

  const confirmBanCustomer = async () => {
    if (!customerToBan || !banReason.trim()) {
      return;
    }

    try {
      setActionError(null);
      await adminApi.updateUserStatus(customerToBan.id, {
        status: "Banned",
        banReason: banReason.trim(),
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === customerToBan.id
            ? { ...user, status: "Banned", banReason: banReason.trim() }
            : user
        )
      );

      setShowBanModal(false);
      setBanReason("");
      setCustomerToBan(null);
    } catch (err: any) {
      setActionError(err.message || "Không thể khóa khách hàng");
    }
  };

  const handleUnbanCustomer = async (user: UserType) => {
    try {
      setActionError(null);
      await adminApi.updateUserStatus(user.id, {
        status: "Active",
        banReason: "",
      });

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, status: "Active", banReason: "" }
            : item
        )
      );
    } catch (err: any) {
      setActionError(err.message || "Không thể mở khóa khách hàng");
    }
  };

  const handleOrderPageChange = (customerId: string, newPage: number) => {
    fetchCustomerOrders(customerId, newPage);
  };

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.toLowerCase();
    const matchesSearch =
      user.fullName.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      user.id.toLowerCase().includes(keyword) ||
      (user.phone && user.phone.toLowerCase().includes(keyword));

    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  const formatCurrency = (value: number) =>
    `₫${Number(value || 0).toLocaleString("vi-VN")}`;

  const getOrderStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
      case "CANCELED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Đang tải danh sách khách hàng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 font-semibold mt-10">
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showBanModal && customerToBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              Khóa khách hàng
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng nhập lý do khóa tài khoản của {customerToBan.fullName}.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do khóa..."
              className="w-full h-28 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmBanCustomer}
                disabled={!banReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
              >
                Xác nhận khóa
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setCustomerToBan(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, SĐT hoặc ID..."
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thông tin khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Liên hệ & Hoạt động
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const isExpanded = expandedRows.has(user.id);
                const orderState = orderStates[user.id];

                return (
                  <Fragment key={user.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleExpandRow(user.id)}
                          disabled={orderState?.loading}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                        >
                          {orderState?.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                            {user.fullName ? user.fullName.charAt(0) : <User className="w-4 h-4" />}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-500">ID: {user.id}</div>
                            <div className="text-xs text-gray-400">
                              Gia nhập: {user.createdAt || "Chưa xác định"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate max-w-xs" title={user.email}>
                              {user.email}
                            </span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Cập nhật lần cuối: {user.updatedAt || "—"}
                          </div>
                          {orderState && !orderState.loading && (
                            <div className="text-xs text-gray-600">
                              Đã đặt {orderState.total} đơn
                            </div>
                          )}
                          {!orderState && (
                            <div className="text-xs text-gray-400">
                              Nhấn để xem lịch sử đơn hàng
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status === "Active" ? (
                            <UserCheck className="w-4 h-4 mr-1" />
                          ) : (
                            <UserX className="w-4 h-4 mr-1" />
                          )}
                          {user.status === "Active"
                            ? "Hoạt động"
                            : user.status === "Inactive"
                            ? "Không hoạt động"
                            : "Bị khóa"}
                        </span>
                        {user.status === "Banned" && user.banReason && (
                          <div className="text-xs text-red-600 mt-1">
                            Lý do: {user.banReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {user.status === "Banned" ? (
                            <button
                              onClick={() => handleUnbanCustomer(user)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Mở khóa"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanCustomer(user)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Khóa khách hàng"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-10 pb-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">
                                Đơn hàng đã đặt
                              </h4>
                              {orderState && orderState.total > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>
                                    Trang {orderState.currentPage} / {orderState.totalPages}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        handleOrderPageChange(
                                          user.id,
                                          Math.max(1, orderState.currentPage - 1)
                                        )
                                      }
                                      disabled={orderState.currentPage === 1}
                                      className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
                                    >
                                      Trước
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOrderPageChange(
                                          user.id,
                                          Math.min(
                                            orderState.totalPages,
                                            orderState.currentPage + 1
                                          )
                                        )
                                      }
                                      disabled={orderState.currentPage === orderState.totalPages}
                                      className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
                                    >
                                      Sau
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {orderState?.error && (
                              <div className="text-red-600 text-sm">
                                {orderState.error}
                              </div>
                            )}

                            {!orderState?.loading && (orderState?.orders?.length ?? 0) === 0 && (
                              <div className="text-sm text-gray-500">
                                Khách hàng chưa có đơn hàng nào.
                              </div>
                            )}

                            {orderState?.loading && (
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải đơn hàng...
                              </div>
                            )}

                            {orderState && orderState.orders.length > 0 && !orderState.loading && (
                              <div className="overflow-x-auto bg-white border rounded">
                                <table className="min-w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                                        Mã đơn
                                      </th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                                        Giá trị
                                      </th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                                        Địa chỉ lấy
                                      </th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                                        Địa chỉ giao
                                      </th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                                        Trạng thái
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orderState.orders.map((order) => (
                                      <tr key={order.id} className="border-t">
                                        <td className="px-3 py-2 font-semibold text-gray-900">
                                          {order.code || "—"}
                                        </td>
                                        <td className="px-3 py-2">
                                          {formatCurrency(order.price)}
                                        </td>
                                        <td
                                          className="px-3 py-2 max-w-xs truncate"
                                          title={order.pickupAddress}
                                        >
                                          {order.pickupAddress || "—"}
                                        </td>
                                        <td
                                          className="px-3 py-2 max-w-xs truncate"
                                          title={order.deliveryAddress}
                                        >
                                          {order.deliveryAddress || "—"}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusBadge(
                                              order.status
                                            )}`}
                                          >
                                            {order.status || "Không xác định"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
          <div className="text-sm text-gray-700">
            Hiển thị {filteredUsers.length} / {totalUsers} khách hàng
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

    </div>
  );
}
