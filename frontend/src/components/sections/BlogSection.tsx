// src/components/sections/BlogSection.tsx
import { Link } from "react-router-dom";

const posts = [
  {
    slug: "kinh-nghiem-van-chuyen-do-cong-kenh",
    title: "Kinh nghiệm vận chuyển đồ cồng kềnh",
    img: "/photo.png",
  },
  {
    slug: "5-meo-dong-goi-do-dien-tu-an-toan",
    title: "5 mẹo đóng gói đồ điện tử an toàn",
    img: "/photo1.png",
  },
  {
    slug: "checklist-chuyen-nha-trong-ngay",
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
            <article key={p.slug} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <img src={p.img} alt={p.title} className="h-44 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                <Link
                  to={`/blog/${p.slug}`}
                  className="mt-3 inline-flex rounded-md bg-[#FF6A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e65f00]"
                >
                  Xem ngay
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
