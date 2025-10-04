import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Phone,
  Edit3,
  Key,
  Trash2,
  Settings,
  X,
  Check,
  Loader2,
} from "lucide-react";

// ---- Interface & type ----
type Role = "Admin" | "Seller" | "Customer" | "Driver" | "Carrier";
type Status = "Active" | "Inactive" | "Suspended";

type User = {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: Role;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
};

// ---- Main Component ----
export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const actualUserId = userId || "68dfd5144e122996f40a9b21";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho popup chỉnh sửa
  const [editOpen, setEditOpen] = useState(false);
  const [editFields, setEditFields] = useState<{
    full_name: string;
    email: string;
    phone: string;
  }>({ full_name: "", email: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Gọi API lấy thông tin user
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/users/${actualUserId}`
      );
      const data: ApiResponse<User> = await res.json();
      if (data.success) setUser(data.data);
      else setError(data.message || "Không thể tải thông tin user");
    } catch (err: any) {
      let msg = "Lỗi kết nối đến server";
      if (typeof err === "object" && err?.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [actualUserId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ---- Helper UI ----
  const getRoleColor = (role: Role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Seller":
        return "bg-blue-100 text-blue-800";
      case "Customer":
        return "bg-green-100 text-green-800";
      case "Driver":
        return "bg-yellow-100 text-yellow-800";
      case "Carrier":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusColor = (status: Status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Mở popup chỉnh sửa, gán giá trị hiện tại vào fields
  const openEdit = () => {
    if (!user) return;
    setEditFields({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
    });
    setEditError(null);
    setEditOpen(true);
    setEditSuccess(false);
  };

  // Xử lý cập nhật user
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);

    // Validate cơ bản
    if (!editFields.full_name.trim()) {
      setEditError("Họ tên không được để trống.");
      setEditLoading(false);
      return;
    }
    if (!/^[\w-.]+@[\w-]+\.[a-z]{2,}$/i.test(editFields.email)) {
      setEditError("Email không hợp lệ.");
      setEditLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/users/${actualUserId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editFields),
        }
      );
      const data: ApiResponse<User> = await res.json();
      if (data.success) {
        setEditSuccess(true);
        setUser(data.data);
        setTimeout(() => {
          setEditOpen(false);
        }, 900);
      } else {
        setEditError(data.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      setEditError("Lỗi máy chủ hoặc kết nối.");
    } finally {
      setEditLoading(false);
    }
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center pt-20">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow">
          <p className="font-bold">Lỗi!</p>
          <p>{error}</p>
          <button
            onClick={fetchUser}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center pt-20">
        <p className="text-gray-600">Không tìm thấy thông tin user</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pb-10 pt-24">
      {/* Popup chỉnh sửa thông tin */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative"
          >
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setEditOpen(false)}
              disabled={editLoading}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-orange-600 flex items-center gap-2">
              <Edit3 className="w-5 h-5" /> Chỉnh sửa thông tin
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFields.full_name}
                onChange={e => setEditFields(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-orange-400 text-base"
                disabled={editLoading}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={editFields.email}
                onChange={e => setEditFields(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-orange-400 text-base"
                disabled={editLoading}
                required
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1 text-gray-700">Số điện thoại</label>
              <input
                type="text"
                value={editFields.phone}
                onChange={e => setEditFields(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-orange-400 text-base"
                disabled={editLoading}
              />
            </div>
            {editError && (
              <div className="mb-3 text-red-600 flex items-center gap-2">
                <X className="w-4 h-4" /> {editError}
              </div>
            )}
            {editSuccess && (
              <div className="mb-3 text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4" /> Cập nhật thành công!
              </div>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded transition"
              disabled={editLoading}
            >
              {editLoading && <Loader2 className="animate-spin w-5 h-5" />}
              Lưu thay đổi
            </button>
          </form>
        </div>
      )}

      {/* Nội dung */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/90 shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-blue-50">
                <h3 className="text-lg font-semibold text-orange-700">
                  Chức năng
                </h3>
              </div>
              <div className="px-6 py-6 space-y-4">
                <button
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 border border-gray-200 rounded-lg transition"
                  onClick={openEdit}
                >
                  <Edit3 className="h-4 w-4 mr-3 text-orange-500" />
                  Chỉnh sửa thông tin
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 border border-gray-200 rounded-lg transition">
                  <Key className="h-4 w-4 mr-3 text-yellow-500" />
                  Đổi mật khẩu
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 border border-gray-200 rounded-lg transition">
                  <Settings className="h-4 w-4 mr-3 text-blue-500" />
                  Cài đặt tài khoản
                </button>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition">
                  <Trash2 className="h-4 w-4 mr-3 text-red-600" />
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>
          {/* Main Profile */}
          <div className="lg:col-span-3">
            <div className="bg-white/95 shadow-xl rounded-2xl border border-gray-100 mb-8 overflow-hidden">
              <div className="px-8 py-10 flex flex-col sm:flex-row items-center sm:items-start bg-gradient-to-r from-blue-50 to-orange-50">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.full_name}
                      className="h-36 w-36 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="h-36 w-36 rounded-full bg-blue-100 flex items-center justify-center shadow-lg border-4 border-white">
                      <UserIcon className="h-16 w-16 text-blue-600" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="mt-8 sm:mt-0 sm:ml-12 flex-1 text-center sm:text-left">
                  <h1 className="text-4xl font-extrabold text-gray-900 mb-2 drop-shadow">
                    {user.full_name}
                  </h1>
                  <div className="flex justify-center sm:justify-start items-center mb-5 space-x-4">
                    <span
                      className={`px-4 py-1 rounded-full text-base font-semibold shadow-sm ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                    <span
                      className={`px-4 py-1 rounded-full text-base font-semibold shadow-sm ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-lg">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>
                        {user.phone || (
                          <span className="text-gray-400 italic">
                            Chưa cập nhật
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-center sm:justify-start">
                    <span className="h-1 w-24 bg-orange-200 rounded-full block"></span>
                  </div>
                </div>
              </div>
              {/* Footer profile */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}