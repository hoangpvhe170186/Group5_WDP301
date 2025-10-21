import { useState } from "react";

type Uploaded = { public_id: string; url: string };

export default function IncidentForm({ orderId }: { orderId: string }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const [type, setType] = useState("Damage");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const token =
  localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  "";


  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const next = [...files, ...list].slice(0, 5); // giới hạn 5 ảnh
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeAt = (i: number) => {
    const nf = files.slice(); nf.splice(i, 1);
    const np = previews.slice(); np.splice(i, 1);
    setFiles(nf); setPreviews(np);
  };

  const uploadImages = async (): Promise<Uploaded[]> => {
    if (files.length === 0) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("folder", `orders/incidents/${orderId}`);

    const res = await fetch(`${API_BASE}/api/upload/images`, {
      method: "POST",
      credentials: "include",                              // gửi cookie
      // KHÔNG set Content-Type cho FormData
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd,
    });
    if (!res.ok) throw new Error("Upload ảnh thất bại");
    return (await res.json()) as Uploaded[];
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setSubmitting(true);
      const evidence_files = await uploadImages();
      const payload = {
        order_id: orderId,
        type,
        description: desc,     // tuỳ chọn
        evidence_files,        // [] nếu không có ảnh
      };

      const res = await fetch(`${API_BASE}/api/incidents`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gửi báo cáo sự cố thất bại");
      setDone(true);
    } catch (err: any) {
      alert(err.message || "Gửi báo cáo sự cố thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <p className="text-green-600">Đã gửi báo cáo sự cố.</p>;

  return (
    <form onSubmit={onSubmit} className="p-3 bg-gray-50 rounded-lg border mt-3 space-y-2">
      <h3 className="font-bold">Báo cáo sự cố (tuỳ chọn)</h3>

      <label className="block text-sm">Loại sự cố</label>
      <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-2 py-1">
        <option value="Damage">Hư hỏng</option>
        <option value="Delay">Trễ hẹn</option>
        <option value="Other">Khác</option>
      </select>

      <label className="block text-sm mt-2">Mô tả (tuỳ chọn)</label>
      <textarea
        className="w-full border rounded p-2"
        placeholder="Mô tả chi tiết..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <div className="mt-2">
        <label className="block text-sm mb-1">Ảnh minh chứng (tuỳ chọn)</label>
        <input type="file" multiple accept="image/*" onChange={onPick} />
        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} className="w-full h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 bg-red-500 text-white px-4 py-1 rounded disabled:opacity-60"
      >
        {submitting ? "Đang gửi..." : "Gửi"}
      </button>
    </form>
  );
}
