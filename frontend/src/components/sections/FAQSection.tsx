import React, { useState } from "react";

const faqs = [
  { q: "Home Express là gì?", a: "Nền tảng đặt dịch vụ chuyển nhà nhanh, minh bạch, tiện lợi." },
  { q: "Cước phí được tính thế nào?", a: "Theo quãng đường, loại xe, thời gian và dịch vụ kèm." },
  { q: "Khi nào có thể chuyển nhà?", a: "Bạn có thể đặt lịch 24/7, chúng tôi phục vụ theo lịch hẹn." },
  { q: "Có theo dõi đơn hàng không?", a: "Có, theo dõi theo thời gian thực trên ứng dụng/web." },
  { q: "Có hỗ trợ đóng gói đồ đặc biệt?", a: "Có, chúng tôi có dịch vụ đóng gói chuyên dụng." },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Câu hỏi thường gặp</h2>

        <div className="mt-6 space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-xl border border-gray-200"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between bg-gray-50 px-4 py-4 text-left"
                >
                  <span className="font-medium text-gray-900">{f.q}</span>
                  <span className="text-[#FF6A00]">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-gray-600">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <a
            href="#"
            className="inline-flex items-center rounded-md bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e65f00]"
          >
            Tìm hiểu thêm
          </a>
        </div>
      </div>
    </section>
  );
}
