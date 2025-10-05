
const services = [
  {
    title: "Vận chuyển khu dân cư",
    desc: "Trọn gói chuyển nhà chuyên nghiệp",
    img: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2022/12/29/khu-dan-cu-la-gi-2.jpg",
  },
  {
    title: "Dịch vụ đóng gói",
    desc: "Đóng gói & mở gói an toàn",
    img: "https://interlogistics.com.vn/static/1131/2023/05/25/dich-vu-dong-goi-hang-hoa-la-gi-1.jpg",
  },
  {
    title: "Vận chuyển trong chung cư",
    desc: "Chuyển nội thành linh hoạt",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Vận chuyển đồ theo yêu cầu",
    desc: "Giá tốt, minh bạch, đơn giản, tiện lợi, theo yêu cầu",
    img: "https://kienvangchuyennha.com.vn/uploads/files/chuyen-nha-tai-ha-noi-2.jpg",
  },
];

export default function ServiceSection() {
  return (
    <section id="services" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Dịch vụ nổi bật</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-40 w-full overflow-hidden">
                <img
                  src={s.img}
                  alt={s.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="space-y-1 p-4">
                <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
                <button className="mt-3 inline-flex rounded-md border border-[#FF6A00] px-3 py-1.5 text-sm font-medium text-[#FF6A00] transition hover:bg-[#FF6A00] hover:text-white">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
