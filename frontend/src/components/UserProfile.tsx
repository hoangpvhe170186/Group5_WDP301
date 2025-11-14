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
  Camera,
} from "lucide-react";
import axios from "axios";
import { createPortal } from "react-dom";
import { getCurrentUserId } from "../lib/auth";

type Role = "Admin" | "Seller" | "Customer" | "Carrier";
type Status = "Active" | "Inactive" | "Suspended";

type User = {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: Role;
  status: Status;
  avatar?: string;
};

type ApiResponse<T> = { success: boolean; data: T; message?: string };

const ROLE_COLOR = {
  Admin: "bg-red-100 text-red-800",
  Seller: "bg-blue-100 text-blue-800",
  Customer: "bg-green-100 text-green-800",
  Carrier: "bg-purple-100 text-purple-800",
} as const;

const STATUS_COLOR = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Suspended: "bg-red-100 text-red-800",
} as const;

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const currentUserId = getCurrentUserId();
  const actualUserId = userId || currentUserId;
  const token = localStorage.getItem("auth_token");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFields, setEditFields] = useState({ full_name: "", email: "", phone: "" });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get<ApiResponse<User>>(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/users/${actualUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setUser(res.data.data);
      else setError(res.data.message || "Không thể tải thông tin người dùng");
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  }, [actualUserId, token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // === Avatar change preview ===
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setEditMessage({ type: "error", text: "File phải là hình ảnh" });
    if (file.size > 5 * 1024 * 1024) return setEditMessage({ type: "error", text: "Ảnh quá lớn (tối đa 5MB)" });

    setEditAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setEditAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // === Open modal ===
  const openEdit = () => {
    if (!user) return;
    setEditFields({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
    });
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    setEditMessage(null);
    setIsEditOpen(true);
  };

  // === Submit edit ===
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage(null);

    try {
      let avatarUrl = user?.avatar;

      if (editAvatarFile) {
        const formData = new FormData();
        formData.append("file", editAvatarFile);
        formData.append("user_id", actualUserId || "");

        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/upload/avatar`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );

        if (uploadRes.data.success) avatarUrl = uploadRes.data.url;
        else throw new Error("Upload avatar thất bại");
      }

      const updateRes = await axios.put<ApiResponse<User>>(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/users/${actualUserId}`,
        { ...editFields, avatar: avatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (updateRes.data.success) {
        setUser(updateRes.data.data);
        setEditMessage({ type: "success", text: "Cập nhật thành công!" });
        setTimeout(() => setIsEditOpen(false), 800);
      } else {
        throw new Error(updateRes.data.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      setEditMessage({ type: "error", text: err?.message || "Lỗi server" });
    } finally {
      setEditLoading(false);
    }
  };

  // === Conditional renders ===
  if (!currentUserId) return <ErrorBox text="Cần đăng nhập để xem thông tin hồ sơ." color="yellow" />;
  if (loading) return <LoadingBox text="Đang tải thông tin..." />;
  if (error) return <ErrorBox text={error} retry={fetchUser} />;
  if (!user) return <ErrorBox text="Không tìm thấy người dùng." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pb-10 pt-24">
      {isEditOpen &&
        createPortal(
          <EditModal
            user={user}
            editFields={editFields}
            setEditFields={setEditFields}
            editAvatarPreview={editAvatarPreview}
            editAvatarFile={editAvatarFile}
            editMessage={editMessage}
            handleAvatarChange={handleAvatarChange}
            handleSubmit={handleEditSubmit}
            onClose={() => setIsEditOpen(false)}
            loading={editLoading}
          />,
          document.body
        )}

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="bg-white shadow-xl rounded-2xl border p-6">
          <h3 className="font-semibold text-orange-700 mb-4">Chức năng</h3>
          <SidebarButton icon={<Edit3 />} label="Chỉnh sửa thông tin" onClick={openEdit} />
          <SidebarButton icon={<Key />} label="Đổi mật khẩu" />
          <SidebarButton icon={<Settings />} label="Đăng xuất" />
          <SidebarButton icon={<Trash2 />} label="Xóa tài khoản" danger />
        </div>

        {/* Profile content */}
        <div className="lg:col-span-3 bg-white shadow-xl rounded-2xl border overflow-hidden">
          <div className="px-8 py-10 flex flex-col sm:flex-row items-center sm:items-start bg-gradient-to-r from-blue-50 to-orange-50">
            <img
              src={user.avatar || ""}
              alt={user.full_name}
              className={`h-36 w-36 rounded-full border-4 border-white shadow-lg object-cover ${
                !user.avatar ? "bg-blue-100 flex items-center justify-center" : ""
              }`}
              onError={(e) => ((e.currentTarget.src = ""), (e.currentTarget.alt = "No avatar"))}
            />
            <div className="mt-6 sm:ml-12 text-center sm:text-left">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{user.full_name}</h1>
              <div className="flex justify-center sm:justify-start gap-3 mb-4">
                <span className={`px-4 py-1 rounded-full font-semibold ${ROLE_COLOR[user.role]}`}>{user.role}</span>
                <span className={`px-4 py-1 rounded-full font-semibold ${STATUS_COLOR[user.status]}`}>
                  {user.status}
                </span>
              </div>
              <div className="space-y-2 text-lg text-gray-700">
                <p className="flex items-center gap-3 justify-center sm:justify-start">
                  <Mail className="h-5 w-5 text-gray-400" /> {user.email}
                </p>
                <p className="flex items-center gap-3 justify-center sm:justify-start">
                  <Phone className="h-5 w-5 text-gray-400" /> {user.phone || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Reusable UI components ===
const SidebarButton = ({ icon, label, onClick, danger = false }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition ${
      danger
        ? "text-red-700 border-red-300 hover:bg-red-50"
        : "text-gray-700 border-gray-200 hover:bg-orange-50"
    }`}
  >
    <span className="mr-3">{icon}</span> {label}
  </button>
);

const LoadingBox = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center min-h-screen text-gray-600">
    <Loader2 className="animate-spin w-6 h-6 mr-3" /> {text}
  </div>
);

const ErrorBox = ({ text, retry, color = "red" }: { text: string; retry?: () => void; color?: string }) => (
  <div className={`min-h-screen flex items-center justify-center bg-${color}-50`}>
    <div className={`bg-${color}-100 border border-${color}-400 text-${color}-700 px-6 py-4 rounded-lg`}>
      <p>{text}</p>
      {retry && (
        <button onClick={retry} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Thử lại
        </button>
      )}
    </div>
  </div>
);

const EditModal = ({
  user,
  editFields,
  setEditFields,
  editAvatarPreview,
  editAvatarFile,
  editMessage,
  handleAvatarChange,
  handleSubmit,
  onClose,
  loading,
}: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fadeIn"
    >
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">
        <X className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-bold mb-6 text-orange-600 flex items-center gap-2">
        <Edit3 className="w-5 h-5" /> Chỉnh sửa thông tin
      </h2>

      <div className="mb-6 flex items-center gap-4">
        <img
          src={editAvatarPreview || user.avatar || ""}
          alt="avatar"
          className="h-16 w-16 rounded-full border object-cover"
        />
        <label className="cursor-pointer">
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
            <Camera className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {editAvatarFile ? "Đã chọn ảnh mới" : "Chọn ảnh đại diện"}
            </span>
          </div>
        </label>
      </div>

      {["full_name", "email", "phone"].map((field) => (
        <div key={field} className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 capitalize">
            {field.replace("_", " ")}
          </label>
          <input
            type={field === "email" ? "email" : "text"}
            value={(editFields as any)[field]}
            onChange={(e) => setEditFields((f: any) => ({ ...f, [field]: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-orange-400"
            disabled={loading}
          />
        </div>
      ))}

      {editMessage && (
        <div
          className={`mb-3 flex items-center gap-2 text-${
            editMessage.type === "error" ? "red" : "green"
          }-600`}
        >
          {editMessage.type === "error" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {editMessage.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
      >
        {loading && <Loader2 className="animate-spin w-5 h-5" />} Lưu thay đổi
      </button>
    </form>
  </div>
);
