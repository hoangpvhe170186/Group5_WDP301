import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/config/api";
type InterviewForm = {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  vehicle_type: string;
  preferred_day: string;   // YYYY-MM-DD hoặc “Tuần này/tuần sau”
  time_slot: string;       // Sáng/Chiều/Tối
  notes: string;
  accept_rules: boolean;
};

export default function DriverInterviewPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState<InterviewForm>({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    vehicle_type: "",
    preferred_day: "",
    time_slot: "",
    notes: "",
    accept_rules: false,
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!form.accept_rules) return alert("Bạn cần đồng ý với Quy định & Điều khoản.");
  try {
    setSubmitting(true);
    // ✅ THÊM /api vào trước URL
    await api.post("/api/driver-interviews/apply", form);
    setOk(true);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Gửi đăng ký thất bại. Vui lòng thử lại.";
    console.error(err);
    alert(msg);
  } finally {
    setSubmitting(false);
  }
}

  if (ok) {
    return (
      <div className="pt-24">
        <section className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Đã nhận đăng ký phỏng vấn</h1>
          <p className="mt-3 text-gray-700">
            Home Express đã ghi nhận thông tin của bạn. Bộ phận tuyển dụng sẽ gọi điện/email để xác nhận
            lịch phỏng vấn trực tiếp trong 24–48h (giờ hành chính).
          </p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-orange-500 px-5 py-2 text-white font-semibold hover:bg-orange-600">
            Về trang chủ
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-24">
      {/* Banner */}
      <section className="relative bg-gradient-to-r from-purple-700 to-blue-600 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-2">Đăng Ký PHỎNG VẤN Tài Xế</h1>
        <p className="opacity-90 max-w-3xl mx-auto">
          Nền tảng trung gian Home Express chỉ tiếp nhận <strong>yêu cầu phỏng vấn trực tiếp</strong>.
          Ứng viên đạt sẽ ký hợp đồng hợp tác và kích hoạt tài khoản.
        </p>
      </section>

      {/* Quy trình & Quy định */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">🛠 Quy trình 2 bước</h2>
          <ol className="mt-4 list-decimal pl-5 space-y-2 text-gray-700 leading-relaxed">
            <li>Nộp yêu cầu phỏng vấn (form bên phải).</li>
            <li>Phỏng vấn trực tiếp tại văn phòng/điểm hẹn. Đạt → ký hợp đồng, xác minh hồ sơ, kích hoạt.</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Lưu ý: Gửi form <strong>không đồng nghĩa</strong> trở thành tài xế. Mọi hồ sơ đều qua vòng phỏng vấn & xét duyệt.
          </p>
        </div>

        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">⚖️ Quy định & Chế tài</h2>
          <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-700 leading-relaxed">
            <li><strong>Report lần 1</strong>: Cảnh cáo bằng văn bản.</li>
            <li><strong>Report lần 2</strong>: Trừ thêm % thu nhập trong kỳ.</li>
            <li><strong>Report lần 3</strong>: Chấm dứt hợp đồng hợp tác.</li>
            <li>Mọi thiệt hại do làm hỏng/mất hàng hoặc xúc phạm khách → <strong>tự bồi thường toàn bộ</strong>.</li>
            <li>Gian lận, huỷ đơn có chủ đích, trì hoãn giao hàng → có thể khóa vĩnh viễn.</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Quy định chi tiết xem tại{" "}
            <Link to="/dieu-khoan" className="underline">Điều khoản hợp tác</Link>.
          </p>
        </div>
      </section>

      {/* Form phỏng vấn */}
      <section className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center">📝 Yêu cầu phỏng vấn trực tiếp</h2>
          <form onSubmit={onSubmit} className="mt-8 grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
              <input name="full_name" value={form.full_name} onChange={onChange} required
                     className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
              <input name="phone" value={form.phone} onChange={onChange} required
                     className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange} required
                     className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Khu vực phỏng vấn</label>
              <select name="city" value={form.city} onChange={onChange} required
                      className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500">
                <option value="">-- Chọn khu vực --</option>
                <option value="hcm">TP. Hồ Chí Minh</option>
                <option value="hn">Hà Nội</option>
                <option value="dn">Đà Nẵng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại xe</label>
              <select name="vehicle_type" value={form.vehicle_type} onChange={onChange} required
                      className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500">
                <option value="">-- Chọn loại xe --</option>
                <option value="van">Xe Van</option>
                <option value="truck">Xe Tải</option>
                <option value="3gac">Xe 3 gác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày mong muốn</label>
              <input type="date" name="preferred_day" value={form.preferred_day} onChange={onChange} required
                     className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Khung giờ</label>
              <select name="time_slot" value={form.time_slot} onChange={onChange} required
                      className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500">
                <option value="">-- Chọn khung giờ --</option>
                <option value="morning">Sáng (9:00–11:00)</option>
                <option value="afternoon">Chiều (14:00–16:00)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú (tuỳ chọn)</label>
              <textarea name="notes" value={form.notes} onChange={onChange} rows={4}
                        className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-purple-500"
                        placeholder="VD: Có thể mang hồ sơ photo/CCCD/Bằng lái, mong muốn phỏng vấn tại..."></textarea>
            </div>

            <label className="md:col-span-2 flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" name="accept_rules" checked={form.accept_rules} onChange={onChange} className="mt-1"/>
              <span>
                Tôi xác nhận đã đọc và đồng ý với <Link to="/dieu-khoan" className="text-purple-600 underline">Quy định & Điều khoản hợp tác</Link>,
                hiểu rằng đây chỉ là <strong>đăng ký phỏng vấn</strong>, chưa phải kích hoạt tài khoản tài xế.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="md:col-span-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu phỏng vấn"}
            </button>
            <p className="md:col-span-2 text-xs text-gray-500">
              Bằng việc gửi, bạn đồng ý để Home Express liên hệ qua điện thoại/email để xác nhận lịch.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
