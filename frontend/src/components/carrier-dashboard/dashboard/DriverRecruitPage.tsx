import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/config/api";

function HomeHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Home Express</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-orange-500 transition-colors">
              Trang chủ
            </Link>
            <Link to="/ve-chung-toi" className="text-gray-600 hover:text-orange-500 transition-colors">
              Về chúng tôi
            </Link>
            <Link to="/lien-he" className="text-gray-600 hover:text-orange-500 transition-colors">
              Liên hệ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

type InterviewForm = {
  full_name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  preferred_day: string;
  time_slot: string;
  notes: string;
  accept_rules: boolean;
  note_image?: { url: string; public_id?: string } | null;
};

export default function DriverInterviewPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState<InterviewForm>({
    full_name: "",
    phone: "",
    email: "",
    vehicle_type: "",
    preferred_day: "",
    time_slot: "",
    notes: "",
    accept_rules: false,
    note_image: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const todayYMD = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
  })();

  const tomorrowYMD = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
  })();

  async function onUploadNoteImage(file: File) {
    setUploadErr(null);
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadErr("Ảnh quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      setUploading(true);
      const { data } = await api.post("/api/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((s) => ({
        ...s,
        note_image: { url: data.url, public_id: data.public_id },
      }));
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Tải ảnh thất bại. Vui lòng thử lại.";
      setUploadErr(msg);
    } finally {
      setUploading(false);
    }
  }

  function onPreferredDayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v && v < todayYMD) {
      alert("Vui lòng chọn ngày hôm nay hoặc trong tương lai.");
      setForm((s) => ({ ...s, preferred_day: todayYMD }));
    } else {
      onChange(e);
    }
  }

  async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!form.accept_rules)
    return alert("Bạn cần đồng ý với Quy định & Điều khoản.");
  try {
    setSubmitting(true);
    
    // THỬ CÁC ENDPOINT KHÁC NHAU
    const endpoints = [
      "/api/driver-interviews/apply",
      "/api/driver-interviews",
      "/api/driver-interview/apply",
      "/api/driver/apply",
      "/api/interview/apply"
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Thử endpoint: ${endpoint}`);
        await api.post(endpoint, form);
        console.log(`✅ Thành công với endpoint: ${endpoint}`);
        setOk(true);
        return;
      } catch (err: any) {
        lastError = err;
        console.log(`❌ Thất bại với endpoint: ${endpoint}`, err.response?.status);
        if (err.response?.status !== 404) {
          // Nếu lỗi khác 404, throw luôn
          throw err;
        }
      }
    }
    
    // Nếu tất cả endpoint đều 404
    throw lastError;
    
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Gửi đăng ký thất bại. Vui lòng thử lại.";
    console.error("❌ Lỗi đăng ký:", err);
    alert(msg);
  } finally {
    setSubmitting(false);
  }
}
  if (ok) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <HomeHeader />
        <section className="max-w-2xl mx-auto px-6 py-16 text-center pt-24">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Đã nhận đăng ký phỏng vấn
            </h1>
            <p className="mt-3 text-gray-700 text-lg leading-relaxed">
              Home Express đã ghi nhận thông tin của bạn. Bộ phận tuyển dụng sẽ
              gọi điện/email để xác nhận lịch phỏng vấn trực tiếp trong 24–48h
              (giờ hành chính).
            </p>
            <Link
              to="/"
              className="mt-8 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Về trang chủ
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <section className="relative bg-gradient-to-r from-purple-100 to-blue-600 text-white pt-20 pb-16 mt-160">
        <div className="absolute top-6 left-6 z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-white transition-all duration-200 hover:shadow-md"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Trở lại trang chủ
          </Link>
        </div>

        <div className="absolute inset-0 bg-black/5"></div>

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Đăng Ký Phỏng Vấn Tài Xế
          </h1>
          <p className="text-xl opacity-95 max-w-3xl mx-auto leading-relaxed">
            Nền tảng trung gian Home Express chỉ tiếp nhận{" "}
            <strong className="font-semibold">
              yêu cầu phỏng vấn trực tiếp
            </strong>
            . Ứng viên đạt sẽ ký hợp đồng hợp tác và kích hoạt tài khoản.
          </p>
        </div>
      </section>

      {/* Process & Rules */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🛠</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Quy trình 2 bước
            </h2>
          </div>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">
                1
              </div>
              <p className="text-gray-700 leading-relaxed">
                Nộp yêu cầu phỏng vấn (form bên phải).
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">
                2
              </div>
              <p className="text-gray-700 leading-relaxed">
                Phỏng vấn trực tiếp tại văn phòng/điểm hẹn. Đạt → ký hợp đồng,
                xác minh hồ sơ, kích hoạt.
              </p>
            </li>
          </ol>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>Lưu ý:</strong> Gửi form{" "}
              <strong>không đồng nghĩa</strong> trở thành tài xế. Mọi hồ sơ
              đều qua vòng phỏng vấn & xét duyệt.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚖️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Quy định & Chế tài
            </h2>
          </div>
          <ul className="space-y-3">
            {[
              "Report lần 1: Cảnh cáo bằng văn bản.",
              "Report lần 2: Trừ thêm % thu nhập trong kỳ.",
              "Report lần 3: Chấm dứt hợp đồng hợp tác.",
              "Mọi thiệt hại do làm hỏng/mất hàng hoặc xúc phạm khách → tự bồi thường toàn bộ.",
              "Gian lận, huỷ đơn có chủ đích, trì hoãn giao hàng → có thể khóa vĩnh viễn.",
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-700">
              Quy định chi tiết xem tại{" "}
              <Link
                to="/dieu-khoan"
                className="font-semibold underline hover:text-purple-800"
              >
                Điều khoản hợp tác
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              📝 Yêu cầu phỏng vấn trực tiếp
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Điền đầy đủ thông tin bên dưới để đăng ký phỏng vấn trực tiếp
              với đội ngũ tuyển dụng của chúng tôi
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="bg-gray-50 rounded-2xl p-8 shadow-sm"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {/* Form Fields */}
              {[
                {
                  label: "Họ và tên",
                  name: "full_name",
                  type: "text",
                  required: true,
                },
                {
                  label: "Số điện thoại",
                  name: "phone",
                  type: "text",
                  required: true,
                },
                {
                  label: "Email",
                  name: "email",
                  type: "email",
                  required: true,
                },
                {
                  label: "Loại xe",
                  name: "vehicle_type",
                  type: "text",
                  required: true,
                  placeholder: "VD: Xe tải 1.25 tấn, xe bán tải, xe 3 gác...",
                },
                {
                  label: "Ngày mong muốn",
                  name: "preferred_day",
                  type: "date",
                  required: true,
                  min: tomorrowYMD,
                },
                {
                  label: "Khung giờ",
                  name: "time_slot",
                  type: "select",
                  required: true,
                  options: [
                    { value: "", label: "-- Chọn khung giờ --" },
                    { value: "morning", label: "Sáng (9:00–11:00)" },
                    { value: "afternoon", label: "Chiều (14:00–16:00)" },
                  ],
                },
              ].map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={
                        form[field.name as keyof InterviewForm] as string
                      }
                      onChange={onChange}
                      required={field.required}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={
                        form[field.name as keyof InterviewForm] as string
                      }
                      onChange={
                        field.name === "preferred_day"
                          ? onPreferredDayChange
                          : onChange
                      }
                      required={field.required}
                      min={field.min}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Notes & File Upload */}
            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="VD: Có thể mang hồ sơ photo/CCCD/Bằng lái, mong muốn phỏng vấn tại..."
              ></textarea>

              {/* File Upload */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ảnh đính kèm (tuỳ chọn)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadNoteImage(f);
                      }}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors duration-200">
                      <svg
                        className="w-8 h-8 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">
                        {uploading ? "Đang tải ảnh..." : "Nhấn để chọn ảnh"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG tối đa 5MB
                      </p>
                    </div>
                  </label>

                  {form.note_image?.url && (
                    <div className="relative">
                      <img
                        src={form.note_image.url}
                        alt="note"
                        className="h-24 w-24 rounded-xl object-cover border shadow-sm"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                        onClick={() =>
                          setForm((s) => ({ ...s, note_image: null }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                {uploadErr && (
                  <div className="text-sm text-red-600 mt-2 bg-red-50 rounded-lg p-3">
                    {uploadErr}
                  </div>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    name="accept_rules"
                    checked={form.accept_rules}
                    onChange={onChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-200">
                    Tôi xác nhận đã đọc và đồng ý với{" "}
                    <Link
                      to="/dieu-khoan"
                      className="text-blue-600 font-semibold hover:text-blue-700 underline"
                    >
                      Quy định & Điều khoản hợp tác
                    </Link>
                    , hiểu rằng đây chỉ là <strong>đăng ký phỏng vấn</strong>,
                    chưa phải kích hoạt tài khoản tài xế.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-60 disabled:transform-none disabled:hover:shadow-lg min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  "Gửi yêu cầu phỏng vấn"
                )}
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Bằng việc gửi, bạn đồng ý để Home Express liên hệ qua điện
                thoại/email để xác nhận lịch.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
