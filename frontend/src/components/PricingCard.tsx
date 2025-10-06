import { useState, useEffect } from "react";

// Mapping từ packageId (small/standard/large) -> ObjectId trong database
const packageIdToObjectId: Record<string, string> = {
  small: "652fa0c3f0aa5a1a1a1a1c11",
  standard: "652fa0c3f0aa5a1a1a1a1c12",
  large: "652fa0c3f0aa5a1a1a1a1c13",
};

type PerKm = { min_km: number; max_km?: number | null; price: number };
type PackageInfo = {
  _id?: string;
  name?: string;
  vehicle?: string;
  workers?: string;
  max_floor?: number;
  wait_time?: number;
  base_price?: number;
};

// Dữ liệu mặc định nếu chưa tải từ JSON
const demoTiers: Record<string, PerKm[]> = {
  small: [{ min_km: 0, max_km: 5, price: 15000 }],
  standard: [{ min_km: 6, max_km: 20, price: 12000 }],
  large: [{ min_km: 21, max_km: null, price: 10000 }],
};

// Hàm parse số Decimal từ JSON
function parseDecimal(d: any): number {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (typeof d === "object" && d["$numberDecimal"]) return Number(d["$numberDecimal"]);
  return 0;
}

// Hàm format tiền tệ
function fmt(v?: number) {
  if (v == null) return "-";
  return v.toLocaleString("vi-VN") + "đ";
}

export default function PricingCard({
  packageId,
  title,
}: {
  packageId: string;
  title: string;
}) {
  const [loadedTiers, setLoadedTiers] = useState<Record<string, PerKm[]>>(demoTiers);
  const [loadedPackages, setLoadedPackages] = useState<Record<string, PackageInfo>>({
    small: {},
    standard: {},
    large: {},
  });
  const [distance, setDistance] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ totalFee: number; matchedTier?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ chỉ lấy đúng data của packageId hiện tại
  const tiers = loadedTiers[packageId] ?? [];

  // Tải dữ liệu JSON công khai
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [pkResp, perKmResp] = await Promise.all([
          fetch("/pricepackages.json"),
          fetch("/priceperkm.json"),
        ]);
        const pkJson = await pkResp.json();
        const perKmJson = await perKmResp.json();

        const map: Record<string, PerKm[]> = {};
        const pkgMap: Record<string, PackageInfo> = {};

        pkJson.forEach((p: any) => {
          const oid = p._id?.["$oid"] ?? p._id;
          pkgMap[oid] = {
            _id: oid,
            name: p.name,
            vehicle: p.vehicle,
            workers: p.workers,
            max_floor: p.max_floor,
            wait_time: p.wait_time,
            base_price: parseDecimal(p.base_price),
          };
        });

        perKmJson.forEach((r: any) => {
          const pid = r.package_id?.["$oid"] ?? r.package_id;
          const item: PerKm = {
            min_km: r.min_km,
            max_km: r.max_km ?? null,
            price: parseDecimal(r.price),
          };
          if (!map[pid]) map[pid] = [];
          const sig = `${item.min_km}_${item.max_km ?? "null"}_${item.price}`;
          if (!map[pid].some((e) => `${e.min_km}_${e.max_km ?? "null"}_${e.price}` === sig)) {
            map[pid].push(item);
          }
        });

        const out: Record<string, PerKm[]> = { small: [], standard: [], large: [] };
        const outPk: Record<string, PackageInfo> = { small: {}, standard: {}, large: {} };

        (Object.keys(packageIdToObjectId) as Array<string>).forEach((k) => {
          const oid = packageIdToObjectId[k];
          const list = (map[oid] || []).sort((a, b) => a.min_km - b.min_km);
          out[k] = list.length > 0 ? list : demoTiers[k];
          if (pkgMap[oid]) outPk[k] = pkgMap[oid];
        });

        if (mounted) {
          setLoadedTiers(out);
          setLoadedPackages(outPk);
        }
      } catch {
        // nếu lỗi thì dùng demoTiers
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Hàm tính cước phí trên client
  function clientCalc(distanceKm: number) {
    const tlist = tiers;
    if (!tlist || tlist.length === 0) return null;
    const matched = tlist.find((t) => {
      if (t.max_km == null) return distanceKm >= t.min_km;
      return distanceKm >= t.min_km && distanceKm <= t.max_km;
    });
    if (!matched) return null;
    const basePrice = loadedPackages[packageId]?.base_price ?? 0;
    const total = distanceKm * matched.price + basePrice;
    return { totalFee: Math.round(total), matchedTier: matched };
  }

  // Gửi request hoặc fallback client tính
  const calc = async () => {
    setError(null);
    setResult(null);
    if (distance < 0) return setError("Vui lòng nhập số km hợp lệ");
    setLoading(true);
    try {
      const resp = await fetch(`/api/pricing/calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, distanceKm: distance }),
      });
      let j: any = null;
      try {
        j = await resp.json();
      } catch {
        const r = clientCalc(distance);
        if (!r) setError("Khoảng cách không nằm trong bất kỳ mức giá nào");
        else setResult(r);
        setLoading(false);
        return;
      }

      if (!j || !j.success) {
        const r = clientCalc(distance);
        if (!r) setError("Khoảng cách không nằm trong bất kỳ mức giá nào");
        else setResult(r);
      } else {
        setResult({ totalFee: j.data.totalFee, matchedTier: j.data.matchedTier });
      }
    } catch {
      const r = clientCalc(distance);
      if (!r) setError("Khoảng cách không nằm trong bất kỳ mức giá nào");
      else setResult(r);
    } finally {
      setLoading(false);
    }
  };

  // ✅ JSX chỉ hiển thị data đúng theo packageId
  return (
    <div className="p-4">
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-4 text-center">
          <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        </div>

        <div className="border-t border-gray-100 px-4 py-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600">Cước phí ban đầu:</div>
              <div className="text-sm text-blue-600">
                {loadedPackages[packageId]?.base_price ? (
                  <span className="font-medium">{fmt(loadedPackages[packageId].base_price)}</span>
                ) : (
                  <a href="/bang-gia" className="text-blue-600 hover:underline">
                    Tham khảo Bảng giá dịch vụ
                  </a>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-700">
              <div>
                <span className="font-semibold">Tải trọng tối đa:</span>{" "}
                {loadedPackages[packageId]?.vehicle ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Nhân công:</span>{" "}
                {loadedPackages[packageId]?.workers ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Tầng tối đa:</span>{" "}
                {loadedPackages[packageId]?.max_floor ?? "-"}
              </div>
              <div>
                <span className="font-semibold">Thời gian chờ:</span>{" "}
                {loadedPackages[packageId]?.wait_time ?? "-"} phút
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm font-semibold text-gray-600">Bảng giá</div>
          <div className="mt-2 space-y-2">
            {tiers.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
              >
                <div className="text-sm text-gray-600">
                  {t.min_km} {t.max_km ? `- ${t.max_km} km` : ">"}{" "}
                </div>
                <div className="text-sm font-medium text-gray-900">{fmt(t.price)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-28 rounded border px-2 py-1"
            />
            <div className="text-sm text-gray-500">km</div>
            <button
              onClick={calc}
              disabled={
                loading ||
                !(tiers && tiers.length > 0 && loadedPackages[packageId]?.base_price !== undefined)
              }
              className="ml-auto rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
            >
              {loading ? "Đang tính..." : "Tính cước"}
            </button>
          </div>

          {(!tiers || tiers.length === 0) && (
            <div className="mt-2 text-sm text-gray-500">
              Dữ liệu bảng giá đang tải hoặc không có. Vui lòng đợi hoặc làm mới trang.
            </div>
          )}

          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

          {result && (
            <div className="mt-3 rounded-md bg-green-50 p-3 text-sm">
              <div>
                Tổng phí: <span className="font-semibold">{fmt(result.totalFee)}</span>
              </div>
              {result.matchedTier && (
                <div className="mt-1 text-xs text-gray-700">
                  Mức áp dụng:{" "}
                  {typeof result.matchedTier.max_km === "number"
                    ? `${result.matchedTier.min_km} - ${result.matchedTier.max_km} km`
                    : `≥ ${result.matchedTier.min_km} km`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
