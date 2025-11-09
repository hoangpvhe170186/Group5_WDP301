import React, { useMemo, useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  IdCard,
  Truck,
  Gauge,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { adminApi } from "@/services/admin.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (carrierId: string) => void;
};

type CarrierForm = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  licenseNumber?: string;
};

type VehicleForm = {
  createVehicle: boolean;
  plate_number?: string;
  type?: string;
  capacity?: number | "";
};

type ValidationErrors = {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  plate_number?: string;
  type?: string;
  capacity?: string;
};

const initialCarrier: CarrierForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  licenseNumber: "",
};

const initialVehicle: VehicleForm = {
  createVehicle: false,
  plate_number: "",
  type: "",
  capacity: "",
};

export default function DriverCreateModal({ open, onClose, onCreated }: Props) {
  const [carrier, setCarrier] = useState<CarrierForm>(initialCarrier);
  const [vehicle, setVehicle] = useState<VehicleForm>(initialVehicle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; code?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // Helper function to extract carrier ID from various response formats
  const extractCarrierId = (res: any): string | null => {
    if (!res) return null;

    // Try different response structures
    const possiblePaths = [
      res.data?._id,
      res.data?.id,
      res._id,
      res.id,
      res.user?._id,
      res.user?.id,
      res.carrier?._id,
      res.carrier?.id,
      res.data?.data?._id,
      res.data?.user?._id,
      res.data?.carrier?._id,
    ];

    for (const id of possiblePaths) {
      if (id) return String(id);
    }

    return null;
  };

  // Fallback: Try to find carrier by email
  const lookupCarrierId = async (email: string): Promise<string | null> => {
    try {
      // Try using adminApi first
      const searchResult = await adminApi.searchUsers({
        email,
        role: "Carrier",
        limit: 1,
      });

      const user = searchResult.users?.[0] || searchResult.data?.[0];
      if (user) {
        return user.id || user._id;
      }
    } catch (err) {
      console.warn("Search users failed:", err);
    }

    return null;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate carrier info
    if (!carrier.full_name.trim()) {
      errors.full_name = "Họ và tên là bắt buộc";
    }

    if (!carrier.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(carrier.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!carrier.phone.trim()) {
      errors.phone = "Số điện thoại là bắt buộc";
    } else if (
      carrier.phone.trim().length < 9 ||
      !/^\d+$/.test(carrier.phone)
    ) {
      errors.phone = "Số điện thoại phải có ít nhất 9 chữ số";
    }

    if (!carrier.password) {
      errors.password = "Mật khẩu là bắt buộc";
    } else if (carrier.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    // Validate vehicle info if creating vehicle
    if (vehicle.createVehicle) {
      if (vehicle.plate_number && !vehicle.plate_number.trim()) {
        errors.plate_number = "Biển số xe không được để trống";
      }

      if (vehicle.type && !vehicle.type.trim()) {
        errors.type = "Loại xe không được để trống";
      }

      if (
        vehicle.capacity &&
        (Number(vehicle.capacity) <= 0 || Number(vehicle.capacity) > 10000)
      ) {
        errors.capacity = "Tải trọng phải từ 1-10000 kg";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canSubmit = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(carrier.email);
    const phoneOk =
      carrier.phone.trim().length >= 9 && /^\d+$/.test(carrier.phone);
    const passOk = carrier.password.length >= 6;
    return carrier.full_name.trim() && emailOk && phoneOk && passOk;
  }, [carrier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    setDone(null);

    try {
      // 1) Prepare carrier data
      const createBody: any = {
        full_name: carrier.full_name.trim(),
        email: carrier.email.trim(),
        phone: carrier.phone.trim(),
        password: carrier.password,
        role: "Carrier",
        licenseNumber: carrier.licenseNumber?.trim() || undefined,
      };

      let carrierId: string | null = null;
      let createError: string | null = null;

      // Try different API endpoints
      const apiAttempts = [
        {
          name: "createCarrier",
          method: () => adminApi.createCarrier(createBody),
        },
        { name: "createUser", method: () => adminApi.createUser(createBody) },
      ];

      for (const attempt of apiAttempts) {
        try {
          console.log(`Trying ${attempt.name}...`);
          const res = await attempt.method();
          carrierId = extractCarrierId(res);

          if (carrierId) {
            console.log(
              `✅ Success with ${attempt.name}, carrierId:`,
              carrierId
            );
            break;
          } else {
            console.warn(
              `⚠️ ${attempt.name} succeeded but no carrier ID found`
            );
          }
        } catch (err: any) {
          console.warn(
            `❌ ${attempt.name} failed:`,
            err?.response?.data || err.message
          );
          createError = err?.response?.data?.message || err.message;
          // Continue to next attempt
        }
      }

      // If all API attempts failed, try fallback lookup
      if (!carrierId) {
        console.log("Trying fallback lookup by email...");
        carrierId = await lookupCarrierId(createBody.email);

        if (!carrierId) {
          throw new Error(
            createError ||
              "Không thể tạo tài xế. Vui lòng kiểm tra:\n" +
                "1. Email có thể đã tồn tại\n" +
                "2. Số điện thoại có thể đã được sử dụng\n" +
                "3. API endpoint có thể không khả dụng"
          );
        }
      }

      // 2) Create vehicle if selected
      if (vehicle.createVehicle && vehicle.plate_number && vehicle.type) {
        try {
          const vBody: any = {
            plate_number: vehicle.plate_number.trim(),
            type: vehicle.type.trim(),
            capacity:
              vehicle.capacity === "" ? undefined : Number(vehicle.capacity),
            carrier_id: carrierId,
            status: "Available",
          };

          console.log("🚗 Creating vehicle with data:", vBody);

          const vehicleResponse = await adminApi.createVehicle(vBody);
          console.log("✅ Vehicle created successfully:", vehicleResponse);
        } catch (vehicleErr: any) {
          console.error("❌ Vehicle creation failed:", vehicleErr);
          console.log("Error details:", vehicleErr.response?.data);
          // Vẫn tiếp tục dù vehicle creation thất bại
        }
      }

      setDone({ id: carrierId });

      // Call callback after 2 seconds to show success message
      setTimeout(() => {
        onCreated?.(carrierId);
        closeAll();
      }, 2000);
    } catch (err: any) {
      console.error("Lỗi khi tạo tài xế:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Tạo tài xế thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const closeAll = () => {
    setCarrier(initialCarrier);
    setVehicle(initialVehicle);
    setError(null);
    setDone(null);
    setValidationErrors({});
    setShowPassword(false);
    onClose?.();
  };

  const handleFieldChange = (field: keyof CarrierForm, value: string) => {
    setCarrier((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Thêm tài xế mới</h2>
          <button
            onClick={closeAll}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Carrier info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Thông tin tài xế <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Họ và tên *"
                    value={carrier.full_name}
                    onChange={(e) =>
                      handleFieldChange("full_name", e.target.value)
                    }
                    disabled={submitting}
                  />
                </label>
                {validationErrors.full_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.full_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Email *"
                    type="email"
                    value={carrier.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    disabled={submitting}
                  />
                </label>
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Số điện thoại *"
                    value={carrier.phone}
                    onChange={(e) =>
                      handleFieldChange(
                        "phone",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    disabled={submitting}
                  />
                </label>
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <IdCard className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Mật khẩu (≥6 ký tự) *"
                    type={showPassword ? "text" : "password"}
                    value={carrier.password}
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value)
                    }
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={submitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </label>
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* License Number */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <IdCard className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Số GPLX (tuỳ chọn)"
                    value={carrier.licenseNumber}
                    onChange={(e) =>
                      handleFieldChange("licenseNumber", e.target.value)
                    }
                    disabled={submitting}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Thông tin phương tiện (tuỳ chọn)
              </h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicle.createVehicle}
                  onChange={(e) =>
                    setVehicle((s) => ({
                      ...s,
                      createVehicle: e.target.checked,
                    }))
                  }
                  disabled={submitting}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                Tạo luôn phương tiện
              </label>
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 transition-opacity ${
                !vehicle.createVehicle ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {/* Plate Number */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Biển số xe"
                    value={vehicle.plate_number}
                    onChange={(e) =>
                      setVehicle((s) => ({
                        ...s,
                        plate_number: e.target.value,
                      }))
                    }
                    disabled={submitting || !vehicle.createVehicle}
                  />
                </label>
                {validationErrors.plate_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.plate_number}
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Loại xe (vd: Xe tải, Xe ba gác, Container...)"
                    value={vehicle.type}
                    onChange={(e) =>
                      setVehicle((s) => ({ ...s, type: e.target.value }))
                    }
                    disabled={submitting || !vehicle.createVehicle}
                  />
                </label>
                {validationErrors.type && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.type}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="flex items-center gap-2 border rounded-lg p-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <Gauge className="w-4 h-4 text-gray-400" />
                  <input
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Tải trọng (kg)"
                    type="number"
                    min="0"
                    max="10000"
                    value={vehicle.capacity as number | ""}
                    onChange={(e) =>
                      setVehicle((s) => ({
                        ...s,
                        capacity:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    disabled={submitting || !vehicle.createVehicle}
                  />
                </label>
                {validationErrors.capacity && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.capacity}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 text-green-600 text-sm p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Tạo tài xế thành công! Đang chuyển hướng...</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              disabled={submitting}
              onClick={closeAll}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Đang tạo..." : "Lưu tài xế"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
