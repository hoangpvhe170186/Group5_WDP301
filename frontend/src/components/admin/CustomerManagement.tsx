// src/components/admin/CustomerManagement.tsx
import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Plus,
  User,
  UserCheck,
  UserX,
  Mail,
  Phone,
} from "lucide-react";
import { adminApi, type User as UserType } from "@/services/admin.service";
import { useNavigate } from "react-router-dom";

// Import Modal
import StatusUpdateModal from "./StatusUpdateModal";

export default function CustomerManagement() {
  // State
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Active" | "Inactive" | "Banned">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getUsersByRole("customers", currentPage, limit);
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

  // Open modal
  const handleEditUserStatus = (user: UserType) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  // CẬP NHẬT TRỰC TIẾP TRONG STATE (không reload)
  const handleStatusUpdate = (userId: string, newStatus: "Active" | "Inactive" | "Banned", banReason?: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus, banReason } : user
      )
    );
  };

  // Filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Helpers
  const getRoleIcon = () => <User className="w-4 h-4" />;
  const getRoleColor = () => "bg-green-100 text-green-800";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Inactive": return "bg-gray-100 text-gray-800";
      case "Banned": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Loading & Error
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <button
          onClick={() => navigate("/admin/customers/add")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm khách hàng
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, ID..."
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thông tin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        {getRoleIcon()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}>
                      {getRoleIcon()}
                      <span className="ml-1">Customer</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status === "Active" ? <UserCheck className="w-4 h-4 mr-1" /> : <UserX className="w-4 h-4 mr-1" />}
                      {user.status}
                    </span>
                    {/* Hiển thị lý do khóa nếu trạng thái là Banned */}
                    {user.status === "Banned" && user.banReason && (
                      <div className="text-xs text-red-600 mt-1">
                        Lý do: {user.banReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
<<<<<<< HEAD
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                    </div>
=======
                    <button
                      onClick={() => handleEditUserStatus(user)}
                      className="text-orange-600 hover:text-orange-900 p-1"
                      title="Sửa trạng thái"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
>>>>>>> long
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Modal */}
      {modalOpen && selectedUser && (
        <StatusUpdateModal
          user={{
            id: selectedUser.id,
            fullName: selectedUser.fullName,
            email: selectedUser.email,
            status: selectedUser.status,
          }}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={(newStatus, banReason) => {
            handleStatusUpdate(selectedUser.id, newStatus, banReason);
            setModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}