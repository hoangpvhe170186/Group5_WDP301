import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, ShieldAlert } from "lucide-react";

interface LockedState {
  email?: string;
  fullName?: string;
  reason?: string;
}

const LOCKED_STORAGE_KEY = "locked_user_info";

export default function AccountLockedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const lockedInfo = useMemo<LockedState>(() => {
    const stateData = (location.state as LockedState) || {};
    if (stateData.email || stateData.reason || stateData.fullName) {
      sessionStorage.setItem(LOCKED_STORAGE_KEY, JSON.stringify(stateData));
      return stateData;
    }

    try {
      const stored = sessionStorage.getItem(LOCKED_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as LockedState) : {};
    } catch (error) {
      console.warn("Unable to parse locked user info", error);
      return {};
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(LOCKED_STORAGE_KEY);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-orange-100">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Tài khoản của bạn đã bị khóa
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Rất tiếc, hệ thống đã tạm khóa quyền truy cập của tài khoản để đảm bảo an toàn.
        </p>

        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 text-left">
          <div className="flex items-center text-orange-700 font-semibold">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Thông tin chi tiết
          </div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {lockedInfo.fullName && (
              <li>
                <span className="font-medium text-gray-900">Họ tên:</span> {lockedInfo.fullName}
              </li>
            )}
            {lockedInfo.email && (
              <li>
                <span className="font-medium text-gray-900">Email:</span> {lockedInfo.email}
              </li>
            )}
            <li>
              <span className="font-medium text-gray-900">Trạng thái:</span> Đã bị khóa
            </li>
            {lockedInfo.reason && (
              <li>
                <span className="font-medium text-gray-900">Lý do được cung cấp:</span>
                <span className="block mt-1 text-gray-800">{lockedInfo.reason}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate("/auth/login")}
            className="w-full py-3 px-4 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
          >
            Quay lại trang đăng nhập
          </button>
          <p className="text-xs text-gray-500">
            Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ để được trợ giúp sớm nhất.
          </p>
        </div>
      </div>
    </div>
  );
}
