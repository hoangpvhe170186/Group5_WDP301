
const posts = [
  {
    title: "Kinh nghiệm vận chuyển đồ cồng kềnh",
    img:"/photo.png"
  },
  {
    title: "5 mẹo đóng gói đồ điện tử an toàn",
    img:"/photo1.png"
  },
  {
    title: "Checklist chuyển nhà trong ngày",
    img: "https://boxnlok.vn/uploads/blog/2025/Checklist-chuyen-nha-chung-cu-day-du-2025/Checklist-chuyen-nha-chung-cu-day-du-2025.jpg",
  },
];

export default function BlogSection() {
  return (
    <section className="bg-[#FFF3EB]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Những mẹo chuyển nhà giúp bạn đỡ vất vả
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.title}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            >
              <img src={p.img} alt={p.title} className="h-44 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                <button className="mt-3 inline-flex rounded-md bg-[#FF6A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e65f00]">
                  Xem ngay
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
