import { useState, useEffect } from "react";
import PricingCard from "../PricingCard";

type VehicleDb = {
  _id: string;
  type: "Van" | "Truck";
  capacity: number;
  plate_number?: string;
  status?: string;
};

const mockFromDb: VehicleDb[] = [
  { _id: "1", type: "Van",   capacity: 500,  plate_number: "29A-11111", status: "Available" },
  { _id: "2", type: "Truck", capacity: 1000, plate_number: "30B-22222", status: "Available" },
  { _id: "3", type: "Truck", capacity: 2000, plate_number: "31C-33333", status: "Available" },
  { _id: "4", type: "Van",   capacity: 500,  plate_number: "32D-44444", status: "Available" },
  { _id: "5", type: "Truck", capacity: 1000, plate_number: "33E-55555", status: "Available" },
  { _id: "6", type: "Truck", capacity: 2000, plate_number: "34F-66666", status: "Available" },
];

const imageByTypeCapacity: Record<string, string> = {
  // files placed in the `public/` folder are served from the site root
  "Van-500": "/van-500.png",
  "Truck-500": "/truck-500.png",
  "Truck-1000": "/truck-1000.png",
  "Truck-1500": "/truck-1500.jpg",
  "Truck-2000": "/truck-2000.jpg",
};

type Spec = {
  baseFareNote?: string;        // text hiển thị
  baseFareNoteUrl?: string;     // URL để chuyển trang
  maxPayload: string;
  innerSize: string;
  suitable: string[];
};

const specsByCapacity: Record<number, Spec> = {
  500: {
    baseFareNote: "Tham khảo Bảng giá dịch vụ",
    baseFareNoteUrl: "/bang-gia",
    maxPayload: "500kg",
    innerSize: "190cm x 140cm x 140cm",
    suitable: [
      "01 máy giặt (≈10kg)",
      "01 tủ lạnh mini (cao dưới 1m)",
      "01 tủ quần áo/tháo rời (cao < 1.5m, ngang < 1m)",
      "Bàn ghế xếp gọn, 4 thùng đồ cá nhân (50x50x50cm)",
    ],
  },
  1000: {
    baseFareNote: "Tham khảo Bảng giá dịch vụ",
    baseFareNoteUrl: "/bang-gia",
    maxPayload: "1 tấn",
    innerSize: "260cm x 160cm x 160cm",
    suitable: [
      "Đồ gia dụng cỡ vừa (tủ lạnh 2 cánh, máy giặt)",
      "10–15 thùng đồ cá nhân",
      "Sofa 2–3 chỗ, giường 1m6 tháo rời",
    ],
  },
  2000: {
    baseFareNote: "Tham khảo Bảng giá dịch vụ",
    baseFareNoteUrl: "/bang-gia",
    maxPayload: "2 tấn",
    innerSize: "350cm x 180cm x 180cm",
    suitable: [
      "Nội thất cồng kềnh (tủ, kệ lớn, bàn làm việc)",
      "Thiết bị văn phòng/đồ đạc nhà 2–3 phòng",
      "20–30 thùng đồ",
    ],
  },
};

type VehicleCard = {
  type: "Van" | "Truck";
  capacity: number;
  image: string;
  title: string;
};

function buildCardsFromDb(records: VehicleDb[]): VehicleCard[] {
  const map = new Map<string, VehicleCard>();
  records.forEach((r) => {
    const key = `${r.type}-${r.capacity}`;
    if (!map.has(key)) {
      const image = imageByTypeCapacity[key] ?? "/images/fallback.jpg";
      const title =
        r.capacity >= 1000
          ? `Xe ${r.type === "Van" ? "van" : "tải"} ${r.capacity / 1000} tấn`
          : `Xe ${r.type === "Van" ? "van" : "tải"} ${r.capacity}kg`;
      map.set(key, { type: r.type, capacity: r.capacity, image, title });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    a.type === b.type ? a.capacity - b.capacity : a.type.localeCompare(b.type)
  );
}

export default function VehicleSection() {
  const [cards, setCards] = useState<VehicleCard[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    setCards(buildCardsFromDb(mockFromDb));
  }, []);

  return (
    <section id="vehicles" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Đa dạng loại xe chuyển nhà</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => {
            const uniqueKey = `${card.type}-${card.capacity}-${idx}`;
            const isOpen = activeKey === uniqueKey;

            return (
              <div
                key={uniqueKey}
                className="relative rounded-xl bg-gray-50 ring-1 ring-gray-200 shadow-sm transition hover:shadow-md">
                <button
                  className="flex w-full flex-col items-center px-6 pt-6 pb-4 text-left"
                  onClick={() => setActiveKey(isOpen ? null : uniqueKey)}
                  aria-expanded={isOpen}
                >
                  <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-md bg-white">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/fallback.jpg";
                      }}
                    />
                  </div>

                  <p className="text-base font-semibold">{card.title}</p>

                  <svg
                    className={`mt-2 h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* chỉ render phần chi tiết khi card mở */}
                {isOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 px-0">
                    <div className="mx-0 rounded-lg bg-white p-4 ring-1 ring-gray-200 shadow-lg">
                      {(() => {
                        const spec = specsByCapacity[card.capacity];
                        return (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-gray-500">Cước phí ban đầu:</p>
                              {spec?.baseFareNoteUrl ? (
                                // Nếu dùng React Router: thay <a> bằng <Link to={spec.baseFareNoteUrl}>
                                <a
                                  href={spec.baseFareNoteUrl}
                                  className="font-medium text-blue-600 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {spec.baseFareNote ?? "Tham khảo Bảng giá dịch vụ"}
                                </a>
                              ) : (
                                <p className="font-medium">
                                  {spec?.baseFareNote ?? "Liên hệ báo giá"}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">Tải trọng tối đa:</p>
                              <p className="font-medium">{spec?.maxPayload ?? "-"}</p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">Kích cỡ khoang chở (D × R × C):</p>
                              <p className="font-medium">{spec?.innerSize ?? "-"}</p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">Phù hợp:</p>
                              <ul className="mt-1 list-disc pl-5 text-sm leading-6 text-gray-700">
                                {(spec?.suitable ?? ["Đồ đạc gia đình/văn phòng"]).map((s) => (
                                  <li key={s}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Hiển thị bảng cước dưới mỗi xe */}
                      <div className="mt-4">
                        {/* map capacity to packageId demo: 500->small,1000->standard,2000->large */}
                        <PricingCard
                          packageId={card.capacity === 500 ? "small" : card.capacity === 1000 ? "standard" : "large"}
                          title={`Bảng giá - ${card.title}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        
      </div>
    </section>
  );
}
