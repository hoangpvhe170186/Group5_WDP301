import { useState } from "react";

export default function FeedbackForm({ orderId }: { orderId: string }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token =
  localStorage.getItem("auth_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        credentials: "include",                       // dùng cookie nếu BE đặt httpOnly
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // hỗ trợ Bearer nếu có
        },
        body: JSON.stringify({ order_id: orderId, rating, comment }), // comment tuỳ chọn
      });
      if (!res.ok) throw new Error("Gửi đánh giá thất bại");
      setDone(true);
    } catch (err: any) {
      alert(err.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <p className="text-green-600">Cảm ơn bạn đã đánh giá!</p>;

  return (
    <form onSubmit={onSubmit} className="p-3 bg-gray-50 rounded-lg border">
      <h3 className="font-bold mb-2">Đánh giá dịch vụ (tuỳ chọn)</h3>
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="border rounded px-2 py-1"
      >
        {[5, 4, 3, 2, 1].map((r) => (
          <option key={r} value={r}>
            {r} ⭐
          </option>
        ))}
      </select>
      <textarea
        className="w-full border rounded p-2 mt-2"
        placeholder="Nhập nhận xét (tuỳ chọn)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 bg-orange-500 text-white px-4 py-1 rounded disabled:opacity-60"
      >
        {submitting ? "Đang gửi..." : "Gửi"}
      </button>
    </form>
  );
}
