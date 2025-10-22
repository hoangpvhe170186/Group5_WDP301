// frontend/src/components/sections/HeroSection.tsx
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
export default function HeroSection() {
  return (
    <section className="relative min-h-[72vh] w-full">
      <img
        src="/vanchuyen.png"
        className="absolute inset-0 h-full w-full object-cover"
        alt="Dịch vụ chuyển nhà"
      />

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative mx-auto flex h-screen max-w-7xl flex-col items-start justify-center px-4 sm:px-6 lg:px-8 pt-28">
        <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
          Dịch Vụ Chuyển Nhà, Chuyển Trọ
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/90">
          Đa dạng từ xe van đến xe tải. Tiết kiệm – Chuyên nghiệp – Nhanh chóng.
        </p>
        <div className="mt-8">
          <Link to="/dat-hang">
            <Button>Đặt hàng ngay</Button>
          </Link>
        </div>
      </div>
      
    </section>
  );
}