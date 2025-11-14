import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/config/api";

type AppItem = {
  _id: string;
  full_name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  preferred_day: string;
  time_slot: string;
  status: "pending" | "qualified" | "rejected";
  created_at: string;
  note_image?: { url: string; public_id?: string } | null;
};

export default function SellerDriverApplications() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await api.get("/api/driver-interviews/list");
      setItems(data);
    } catch (err) {
      console.error("Failed to load driver applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id: string, status: "qualified" | "rejected") => {
    await api.patch(`/api/driver-interviews/${id}/status`, { status });
    fetchData();
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  function formatTimeSlot(v?: string) {
    switch (v) {
      case "morning":
        return "Sáng (9:00–11:00)";
      case "afternoon":
        return "Chiều (14:00–16:00)";
      case "evening":
        return "Tối (19:00–21:00)";
      default:
        return v || "-";
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Hồ sơ phỏng vấn tài xế</h1>
        <Link
          to="/seller/home"
          className="rounded-lg bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
        >
          ← Trở lại trang chủ
        </Link>
      </div>

      <div className="grid gap-4">
        {items.map((it) => (
          <div key={it._id} className="rounded-lg border p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {it.full_name} — {it.phone}
                </div>
                <div className="text-sm text-gray-600">
                  {it.email} • {it.vehicle_type}
                </div>
                <div className="text-sm text-gray-600">
                  Hẹn: {new Date(it.preferred_day).toLocaleDateString()} •{" "}
                  {formatTimeSlot(it.time_slot)}
                </div>

                <div className="mt-2 space-y-2">
                  {it.notes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Ghi chú:</span> {it.notes}
                    </div>
                  )}

                  {it.note_image?.url && (
                    <img
                      src={it.note_image.url}
                      alt="note"
                      className="h-24 w-24 rounded-md object-cover border"
                    />
                  )}
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  it.status === "pending"
                    ? "bg-yellow-50 text-yellow-700"
                    : it.status === "qualified"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {it.status === "pending"
                  ? "Đang chờ"
                  : it.status === "qualified"
                  ? "Đạt"
                  : "Không đạt"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${it.phone}`}
                className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
              >
                Gọi điện
              </a>
              <a
                href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(
                  it.email
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
              >
                Gửi email
              </a>
              <button
                onClick={() => updateStatus(it._id, "qualified")}
                className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
              >
                Đánh dấu Đạt
              </button>
              <button
                onClick={() => updateStatus(it._id, "rejected")}
                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Đánh dấu Không đạt
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            Không có hồ sơ phỏng vấn nào.
          </div>
        )}
      </div>
    </div>
  );
}
