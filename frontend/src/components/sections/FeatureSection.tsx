import React from "react";

const features = [
  {
    title: "Giá Tốt & Minh Bạch",
    desc: "Biết trước cước phí, không phí ẩn. Nhiều ưu đãi hấp dẫn.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path stroke="currentColor" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
  },
  {
    title: "Tiết kiệm thời gian & công sức",
    desc: "Đặt xe nhanh, linh hoạt lịch trình, theo dõi đơn theo thời gian thực.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path stroke="currentColor" strokeWidth="1.8" d="M12 8v8m-4-4h8" />
      </svg>
    ),
  },
  {
    title: "Đa dạng loại xe",
    desc: "Xe tải 500kg đến 2 tấn, xe van, phù hợp mọi nhu cầu chuyển nhà.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path stroke="currentColor" strokeWidth="1.8" d="M4 11h16l-2 6H6l-2-6Z" />
      </svg>
    ),
  },
  {
    title: "Đội ngũ chuyên nghiệp",
    desc: "Tài xế & bốc xếp có kinh nghiệm, đảm bảo an toàn đồ đạc.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 21a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

export default function FeatureSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Tại sao nên chọn chuyển nhà Home Express?
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#ffd1b2] bg-white/80 p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3 text-[#FF6A00]">
                {f.icon}
                <span className="text-lg font-semibold text-gray-900">{f.title}</span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
