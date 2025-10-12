import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
type Tier = {
  _id: string;
  min_km: number;
  max_km?: number | null;
  price: number;
};

type PackageDetails = {
  _id: string;
  name: string;
  vehicle: any;
  workers: string;
  max_floor: number;
  wait_time: number;
  base_price: number;
};

function fmt(v?: number | string) {
  if (v == null) return "-";
  const num = typeof v === "string" ? Number(v) : v;
  return num.toLocaleString("vi-VN") + "đ";
}

export default function PricingCard({
  packageName,
  title,
}: {
  packageName: string;
  title: string;
}) {
  const [pkgDetails, setPkgDetails] = useState<PackageDetails | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [distance, setDistance] = useState<number>(5); // State lưu giá trị SỐ để tính toán
  const [inputValue, setInputValue] = useState<string>("5"); // State lưu giá trị CHUỖI để hiển thị
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Lỗi khi tải dữ liệu
  const [calcError, setCalcError] = useState<string | null>(null); // Lỗi khi tính cước
  const [calcResult, setCalcResult] = useState<{ totalFee: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!packageName) return;
    setIsLoading(true);
    setError(null);
    setCalcResult(null);
    fetch(`/api/pricing/details/${encodeURIComponent(packageName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy dữ liệu giá cho loại xe này.");
        return res.json();
      })
      .then((data) => {
        setPkgDetails(data.package);
        setTiers(data.tiers);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Lỗi khi tải dữ liệu bảng giá.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [packageName]);

  const handleCalc = async () => {
    if (distance < 0 || !pkgDetails) return;
    setIsCalculating(true);
    setError(null);
    setCalcResult(null);
    setCalcError(null); // ✅ reset lỗi cũ

    try {
      const resp = await fetch(`/api/pricing/calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkgDetails._id,
          distanceKm: distance,
        }),
      });

      const result = await resp.json();

      if (!result.success) {
        // ✅ Ghi lỗi hiển thị bên dưới input
        setCalcError(result.message || "Lỗi tính toán.");
        return;
      }

      setCalcResult(result.data);
    } catch (err: any) {
      setCalcError(err.message || "Không thể tính cước.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Chỉ cho phép nhập số hoặc để trống
    if (!/^\d*$/.test(value)) return;

    // Cập nhật giá trị hiển thị
    setInputValue(value);

    // Nếu người dùng xóa hết -> coi như 0 trong logic
    if (value === "") {
      setDistance(0);
      return;
    }

    // Chuyển sang số để loại bỏ 0 vô nghĩa ở đầu
    const numericValue = Number(value);
    setDistance(numericValue);

    // Nếu có 0 ở đầu (ví dụ '010') thì đồng bộ lại inputValue thành '10'
    if (value !== String(numericValue)) {
      setInputValue(String(numericValue));
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Đang tải bảng giá...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-primary text-white px-6 py-4 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500">Cước phí ban đầu</div>
            <div className="text-xl font-bold text-primary">
              {fmt(pkgDetails?.base_price)}
            </div>
          </div>
          <div className="text-sm text-gray-700 text-right">
            <div>
              <span className="font-medium text-gray-500">Tải trọng:</span>{" "}
              {typeof pkgDetails?.vehicle === "object"
                ? `${pkgDetails.vehicle.capacity}kg`
                : pkgDetails?.vehicle ?? "-"}
            </div>
            <div>
              <span className="font-medium text-gray-500">Nhân công:</span>{" "}
              {pkgDetails?.workers ?? "-"}
            </div>
            <div>
              <span className="font-medium text-gray-500">Tầng tối đa:</span>{" "}
              {pkgDetails?.max_floor ?? "-"}
            </div>
            <div>
              <span className="font-medium text-gray-500">Thời gian chờ:</span>{" "}
              {pkgDetails?.wait_time ?? "-"} phút
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bảng giá chi tiết (VNĐ/km)
          </label>
          <div className="space-y-2">
            {tiers.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2"
              >
                <div className="text-sm text-gray-800">
                  {t.min_km} {t.max_km ? `- ${t.max_km} km` : "km trở lên"}
                </div>
                <div className="text-sm font-semibold text-primary-dark">
                  {fmt(t.price)}
                </div>
              </div>
            ))}
            {tiers.length === 0 && (
              <div className="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded-md">
                Chưa có bảng giá chi tiết.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={inputValue}
              onChange={handleDistanceChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCalc();
                }
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 pl-4 pr-12 py-2"
              placeholder="Nhập số km"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
              km
            </span>
          </div>
          <button
            onClick={handleCalc}
            disabled={isCalculating || tiers.length === 0 || distance < 0}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-6 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCalculating ? "Đang tính..." : "Tính cước"}
          </button>
        </div>

        {calcError && (
          <div className="mt-2 text-sm text-red-600">{calcError}</div>
        )}

        {calcResult && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-center">
            <div className="text-sm text-gray-600">Tổng chi phí ước tính</div>
            <div className="text-2xl font-bold text-green-700">
              {fmt(calcResult.totalFee)}
            </div>
            <div className="mt-4">
              <Link 
                to="/thanh-toan" 
                // Gửi dữ liệu qua 'state' để trang Checkout có thể nhận
                state={{ 
                  bookingDetails: {
                    packageId: pkgDetails?._id,
                    packageName: pkgDetails?.name,
                    distance: distance,
                    totalFee: calcResult.totalFee
                  }
                }}
                className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Tiến hành Thanh toán
              </Link>
            </div>
          </div>
          
        )}      
      </div>
    </div>
  );
}
