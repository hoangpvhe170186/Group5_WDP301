import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PricingCard from "../PricingCard";

type Vehicle = {
  _id: string;
  plate_number: string;
  type: "Truck";
  capacity: number;
  status: string;
  image?: {
    original?: string;
    thumb?: string;
    public_id?: string;
    url?: string;
  };
};

type Spec = {
  baseFareNote?: string;
  baseFareNoteUrl?: string;
  maxPayload: string;
  innerSize: string;
  suitable: string[];
};

// ✂️ Chỉ giữ 3 mức: 500, 1500, 3000
const specsByCapacity: Record<number, Spec> = {
  500: {
    baseFareNote: "Tham khảo Bảng giá dịch vụ",
    baseFareNoteUrl: "/bang-gia",
    maxPayload: "500kg",
    innerSize: "190cm x 140cm x 140cm",
    suitable: [
      "01 máy giặt (≈10kg)",
      "01 tủ lạnh mini (cao < 1m)",
      "01 tủ quần áo/tháo rời (cao < 1.5m, ngang < 1m)",
      "4–6 thùng đồ cá nhân (50×50×50cm)",
    ],
  },
  1500: {
    baseFareNote: "Tham khảo Bảng giá dịch vụ",
    baseFareNoteUrl: "/bang-gia",
    maxPayload: "1.5 tấn",
    innerSize: "300cm x 170cm x 170cm",
    suitable: [
      "Nội thất cỡ vừa–lớn",
      "15–25 thùng đồ",
      "Phù hợp chuyển trọ căn 1–2 phòng",
    ],
  },
  3000: {
    baseFareNote: "Tham khảo Bảng giá dịch vụ",
    baseFareNoteUrl: "/bang-gia",
    maxPayload: "3 tấn",
    innerSize: "420cm x 190cm x 200cm",
    suitable: [
      "Văn phòng nhỏ 3–5 người",
      "Thiết bị cồng kềnh, nhiều thùng hàng",
      "Chuyển nhà 2–3 phòng ngủ",
    ],
  },
};

// Upload ảnh cho từng xe
function UploadImageButton({
  plate,
  onUploaded,
}: {
  readonly plate: string;
  readonly onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const API_BASE =
    (import.meta as any).env?.VITE_API_BASE || "";

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("plate_number", plate);

    try {
      const res = await fetch(`${API_BASE}/api/upload/vehicle`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url, public_id } = await res.json();

      const patch = await fetch(`${API_BASE}/api/vehicles/${plate}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, public_id }),
      });
      if (!patch.ok) throw new Error("Update DB failed");

      onUploaded();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col items-center mt-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-1 rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 text-sm"
      >
        {uploading ? "Đang tải..." : "Tải ảnh lên"}
      </button>
    </div>
  );
}

export default function VehicleSection() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const API_BASE =
    (import.meta as any).env?.VITE_API_BASE ||
    "";

  const fetchVehicles = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/vehicles`, { credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch /api/vehicles failed:", err);
      setError("Không tải được danh sách xe.");
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Gom nhóm theo capacity/type (chỉ còn Truck)
  const grouped = vehicles.reduce((acc: Record<string, Vehicle[]>, v) => {
    const key = `Truck-${v.capacity}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(v);
    return acc;
  }, {});

  // Map gói giá
  const getPackageId = (cap: number) => {
    if (cap <= 500) return "small";
    if (cap <= 1500) return "standard";
    return "large"; // 3000
  };

  return (
    <section id="vehicles" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Đa dạng loại xe chuyển nhà</h2>

        {!!error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {Object.keys(grouped).length === 0 && !error && (
          <p className="mt-3 text-sm text-gray-500">Chưa có xe nào để hiển thị.</p>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).map(([key, list]) => {
            const first = list[0];
            const spec = specsByCapacity[first.capacity];
            const image =
              first.image?.thumb || first.image?.original ||(first.image as any)?.url || "/images/fallback.jpg";
            const title =
              first.capacity >= 1000
                ? `Xe tải ${first.capacity / 1000} tấn`
                : `Xe tải ${first.capacity}kg`;
            const isOpen = activeKey === key;

            return (
              <div
                key={key}
                className="relative rounded-xl bg-gray-50 ring-1 ring-gray-200 shadow-sm transition hover:shadow-md"
              >
                <div className="flex w-full flex-col items-center px-6 pt-6 pb-4 text-left">
                  <div
                    className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-md bg-white cursor-pointer"
                    onClick={() => navigate(`/vehicles/${first._id}/price`)}
                  >
                    <img
                      src={image}
                      alt={title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.dataset.fbk) {
                          img.dataset.fbk = "1";
                          img.src = "/images/fallback.jpg";
                        }
                      }}
                    />
                  </div>

                  <p className="text-base font-semibold">{title}</p>

                  <button
                    aria-expanded={isOpen}
                    className="mt-2"
                    onClick={() => setActiveKey(isOpen ? null : key)}
                  >
                    <svg
                      className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {isOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 px-0">
                    <div className="mx-0 rounded-lg bg-white p-4 ring-1 ring-gray-200 shadow-lg">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>                         
                          {spec?.baseFareNoteUrl ? (
                            <a
                              href={spec.baseFareNoteUrl}
                              className="font-medium text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                           <div>
                          <p className="text-sm text-gray-500">Tải trọng tối đa:</p>
                          <p className="font-medium">{spec?.maxPayload ?? "-"}</p>
                        </div>
                            </a>
                          ) : (
                            <p className="font-medium">
                              {spec?.baseFareNote ?? "Liên hệ báo giá"}
                            </p>
                          )}
                        </div>

                        

                        <div>
                          <p className="text-sm text-gray-500">
                            Kích cỡ khoang chở (D × R × C):
                          </p>
                          <p className="font-medium">{spec?.innerSize ?? "-"}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Phù hợp:</p>
                          <ul className="mt-1 list-disc pl-5 text-sm leading-6 text-gray-700">
                            {(spec?.suitable ?? ["Đồ đạc gia đình/văn phòng"]).map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <UploadImageButton plate={first.plate_number} onUploaded={fetchVehicles} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
