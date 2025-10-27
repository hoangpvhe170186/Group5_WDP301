// SellerDriverApplications.tsx
import { useEffect, useState } from "react";
import { api } from "@/config/api";
type AppItem = {
  _id: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  vehicle_type: string;
  preferred_day: string;
  time_slot: string;
  status: "pending" | "qualified" | "rejected";
  created_at: string;
};

export default function SellerDriverApplications() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

 const fetchData = async () => {
  const { data } = await api.get("/api/driver-interviews/list");
  setItems(data);
  setLoading(false);
};

  useEffect(() => { fetchData(); }, []);

const updateStatus = async (id: string, status: "qualified" | "rejected") => {
  await api.patch(`/api/driver-interviews/${id}/status`, { status });
  fetchData();
};

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Hồ sơ phỏng vấn tài xế</h1>
      <div className="grid gap-4">
        {items.map((it) => (
          <div key={it._id} className="rounded-lg border p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{it.full_name} — {it.phone}</div>
                <div className="text-sm text-gray-600">{it.email} • {it.city} • {it.vehicle_type}</div>
                <div className="text-sm text-gray-600">Hẹn: {new Date(it.preferred_day).toLocaleDateString()} • {it.time_slot}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm ${it.status==="pending"?"bg-yellow-50 text-yellow-700":it.status==="qualified"?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>
                {it.status === "pending" ? "Đang chờ" : it.status === "qualified" ? "Đạt" : "Không đạt"}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <a href={`tel:${it.phone}`} className="rounded-md bg-gray-100 px-3 py-1 text-sm">Gọi điện</a>
              <a href={`mailto:${it.email}`} className="rounded-md bg-gray-100 px-3 py-1 text-sm">Gửi email</a>
              <button onClick={() => updateStatus(it._id, "qualified")} className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
                Đánh dấu Đạt
              </button>
              <button onClick={() => updateStatus(it._id, "rejected")} className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
                Đánh dấu Không đạt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
