// src/components/admin/modals/StatusUpdateModal.tsx
import { useState } from "react";
import { X, Shield, AlertCircle, Save } from "lucide-react";
import { adminApi } from "@/services/admin.service";

interface StatusUpdateModalProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    status: "Active" | "Inactive" | "Banned";
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Gọi lại để reload danh sách
}

export default function StatusUpdateModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: StatusUpdateModalProps) {
  const [status, setStatus] = useState(user.status);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (status === "Banned" && !reason.trim()) {
      setError("Vui lòng nhập lý do khóa tài khoản");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await adminApi.updateUser(user.id, {
        status,

      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold">Cập nhật trạng thái</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600">Khách hàng</p>
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Trạng thái mới
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(["Active", "Inactive", "Banned"] as const).map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                    ${status === s ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:bg-gray-50"}
                  `}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${status === s ? "border-orange-500" : "border-gray-300"}
                    `}
                  >
                    {status === s && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                  </div>
                  <span className="font-medium">
                    {s === "Active" && "Hoạt động"}
                    {s === "Inactive" && "Không hoạt động"}
                    {s === "Banned" && "Bị khóa"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ban Reason */}
          {status === "Banned" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do khóa tài khoản <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do (bắt buộc)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading || status === user.status}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}