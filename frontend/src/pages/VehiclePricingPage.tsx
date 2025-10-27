import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PricingCard from "../components/PricingCard";
import HomeFooter from "../components/HomeFooter";

type Vehicle = {
  _id: string;
  plate_number: string;
  type: string;
  capacity: number;
  status: string;
  image?: { original?: string; thumb?: string };
};

// Kiểu dữ liệu cho danh sách điều hướng
type NavVehicle = {
  _id: string;
  capacity: number;
};

function getPackageName(cap: number): string {
  if (cap <= 500) return "Gói Nhỏ";
  if (cap <= 1500) return "Gói Chung";
  return "Gói Lớn";
}

export default function VehiclePricingPage() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [allVehicles, setAllVehicles] = useState<NavVehicle[]>([]); 
  const [error, setError] = useState<string | null>(null);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

  // useEffect để lấy thông tin xe hiện tại (giữ nguyên)
  useEffect(() => {
    if (!vehicleId) return;
    setVehicle(null); 
    setError(null);
    fetch(`${API_BASE}/api/vehicles/${vehicleId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setVehicle(j.vehicle || j))
      .catch((e) => {
        console.error(e);
        setError("Không tải được thông tin xe");
      });
  }, [vehicleId]); // Thêm vehicleId làm dependency để fetch lại khi URL thay đổi

  
  useEffect(() => {
    fetch(`${API_BASE}/api/vehicles/navigation-list`)
      .then(res => res.json())
      .then(data => setAllVehicles(data))
      .catch(err => console.error("Failed to fetch navigation vehicles:", err));
  }, []); // Chỉ chạy 1 lần khi component được tạo

  // 👇 Logic tìm xe trước và xe tiếp theo
  const currentIndex = allVehicles.findIndex(v => v._id === vehicleId);
  const prevVehicle = currentIndex > 0 ? allVehicles[currentIndex - 1] : null;
  const nextVehicle = currentIndex !== -1 && currentIndex < allVehicles.length - 1 ? allVehicles[currentIndex + 1] : null;

  if (error)
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 underline">Quay về trang chủ</Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay về trang chủ
          </Link>
        </div>

        {!vehicle && <p className="mt-4 text-center text-gray-500">Đang tải thông tin xe...</p>}

        {vehicle && (
          <>
            <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200 shadow-sm">
              <div className="md:grid md:grid-cols-3 md:gap-8">
                <div className="md:col-span-1">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-50">
                    <img
                      src={vehicle.image?.original || vehicle.image?.thumb || "/images/fallback.jpg"}
                      alt={vehicle.plate_number}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                      <p><span className="font-semibold text-gray-500">Biển số:</span> <span className="font-medium text-gray-900">{vehicle.plate_number}</span></p>
                      <p><span className="font-semibold text-gray-500">Trạng thái:</span> <span className="font-medium text-gray-900">{vehicle.status}</span></p>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 md:col-span-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vehicle.capacity >= 1000 ? `Xe tải ${vehicle.capacity / 1000} tấn` : `Xe tải ${vehicle.capacity}kg`}
                  </h1>
                  <p className="mt-2 text-base text-gray-600">Thông tin chi tiết và tính cước cho xe đã chọn.</p>

                  <div className="mt-6">
                    <PricingCard packageName={getPackageName(vehicle.capacity)} title={`Bảng giá chi tiết`} />
                  </div>
                </div>
              </div>
            </div>

            {/* 👇 Khối JSX mới cho các nút điều hướng */}
            <div className="mt-8 flex justify-between items-center">
              <div>
                {prevVehicle && (
                  <Link 
                    to={`/vehicles/${prevVehicle._id}/price`}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Xe Tải {prevVehicle.capacity < 1000 ? `${prevVehicle.capacity}kg` : `${prevVehicle.capacity / 1000} tấn`}
                  </Link>
                )}
              </div>
              <div>
                {nextVehicle && (
                  <Link 
                    to={`/vehicles/${nextVehicle._id}/price`}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                  >
                    Xe Tải {nextVehicle.capacity < 1000 ? `${nextVehicle.capacity}kg` : `${nextVehicle.capacity / 1000} tấn`}
                    <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}