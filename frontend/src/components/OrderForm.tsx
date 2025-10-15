"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderFormProps {
  onAddressChange?: (pickup: string, delivery: string) => void;
  onEstimate?: (distance: string, duration: string, fee: number) => void;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoicXVhbmcxOTExIiwiYSI6ImNtZ3Bjc2hkNTI3N2Yybm9raGN5NTk2M2oifQ.mtyOW12zbuT7eweGm3qO9w";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function OrderForm({
  onAddressChange,
  onEstimate,
}: Readonly<OrderFormProps>) {
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [form, setForm] = useState({
    pickup_address: "",
    delivery_address: "",
    total_price: "",
    phone: "", // ✅ Thêm trường phone
  });
  const [loading, setLoading] = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const navigate = useNavigate();

  const pickupGeoRef = useRef<HTMLDivElement | null>(null);
  const deliveryGeoRef = useRef<HTMLDivElement | null>(null);

  // 📦 Lấy danh sách gói giá
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/pricing");
        setPackages(res.data?.packages || []);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách gói giá:", error);
      }
    };
    fetchPackages();
  }, []);

  // 🗺️ Khởi tạo Mapbox Geocoder
  useEffect(() => {
    if (!pickupGeoRef.current || !deliveryGeoRef.current) return;

    const commonOpts = {
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false,
      language: "vi",
      countries: "VN",
      placeholder: "Nhập địa chỉ...",
    };

    const pickupGeocoder = new MapboxGeocoder({
      ...commonOpts,
      placeholder: "📦 Nhập địa chỉ lấy hàng...",
    });
    const deliveryGeocoder = new MapboxGeocoder({
      ...commonOpts,
      placeholder: "🚚 Nhập địa chỉ giao hàng...",
    });

    pickupGeocoder.addTo(pickupGeoRef.current);
    deliveryGeocoder.addTo(deliveryGeoRef.current);

    pickupGeocoder.on("result", (e: any) => {
      const address = e.result?.place_name || "";
      setForm((prev) => ({ ...prev, pickup_address: address }));
      onAddressChange?.(address, form.delivery_address);
    });

    deliveryGeocoder.on("result", (e: any) => {
      const address = e.result?.place_name || "";
      setForm((prev) => ({ ...prev, delivery_address: address }));
      onAddressChange?.(form.pickup_address, address);
    });

    return () => {
      pickupGeocoder.clear();
      pickupGeocoder.onRemove();
      deliveryGeocoder.clear();
      deliveryGeocoder.onRemove();
    };
  }, [onAddressChange]);

  // 🧮 Tính giá tự động
  const handleEstimatePrice = async () => {
    try {
      const res = await axios.post("http://localhost:4000/api/pricing/estimate2", {
        pickup_address: form.pickup_address,
        delivery_address: form.delivery_address,
        pricepackage_id: selectedPackage,
      });

      if (!res.data?.success) return alert(res.data?.message || "Không thể tính giá");

      const data = res.data.data;
      setForm((prev) => ({ ...prev, total_price: String(data.totalFee) }));
      setDistanceText(data.distance.text);
      setDurationText(data.duration.text);
      onEstimate?.(data.distance.text, data.duration.text, Number(data.totalFee));
    } catch (err) {
      console.error("❌ Lỗi khi tính giá:", err);
      alert("Không thể tính giá tự động");
    }
  };

  // 🧾 Gửi đơn hàng
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(form.phone)) {
      alert("Vui lòng nhập số điện thoại hợp lệ (VD: 090xxxxxxx)");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập trước khi đặt hàng!");

      const res = await axios.post(
        "http://localhost:4000/api/orders",
        {
          pickup_address: form.pickup_address,
          delivery_address: form.delivery_address,
          total_price: parseFloat(form.total_price),
          pricepackage_id: selectedPackage,
          phone: form.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Order created:", res.data);
      alert("🎉 Đặt hàng thành công!");
      setForm({ pickup_address: "", delivery_address: "", total_price: "", phone: "" });
      setSelectedPackage("");
      setDistanceText("");
      setDurationText("");
    } catch (err) {
      console.error("❌ Lỗi khi tạo đơn hàng:", err);
      alert("Đặt hàng thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-5">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          🧾 Tạo đơn hàng mới
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">

        {/* ✅ Nút quay lại trang chủ */}
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            ⬅️ Quay lại trang chủ
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Địa chỉ lấy hàng */}
          <div>
            <Label className="font-semibold text-gray-700">Địa chỉ lấy hàng</Label>
            <div ref={pickupGeoRef} className="mt-1" />
            <p className="text-sm text-gray-500 mt-2 italic">
              {form.pickup_address || "Chưa chọn địa chỉ lấy hàng"}
            </p>
          </div>

          {/* Địa chỉ giao hàng */}
          <div>
            <Label className="font-semibold text-gray-700">Địa chỉ giao hàng</Label>
            <div ref={deliveryGeoRef} className="mt-1" />
            <p className="text-sm text-gray-500 mt-2 italic">
              {form.delivery_address || "Chưa chọn địa chỉ giao hàng"}
            </p>
          </div>

          {/* Số điện thoại */}
          <div>
            <Label className="font-semibold text-gray-700">Số điện thoại</Label>
            <input
              type="tel"
              className="border rounded-md p-2 w-full focus:border-blue-600 focus:ring-1 focus:ring-blue-400 transition"
              placeholder="Nhập số điện thoại..."
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          {/* Gói giá */}
          <div>
            <Label className="font-semibold text-gray-700">Chọn gói giá</Label>
            <select
              className="border rounded-md p-2 w-full bg-white hover:border-blue-400 focus:border-blue-600 transition-colors"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              required
            >
              <option value="">-- Chọn gói giá --</option>
              {packages.length > 0 ? (
                packages.map((pkg) => {
                  const basePrice =
                    typeof pkg.base_price === "object" && pkg.base_price.$numberDecimal
                      ? Number(pkg.base_price.$numberDecimal)
                      : Number(pkg.base_price);
                  return (
                    <option key={pkg._id} value={pkg._id}>
                      {pkg.name} — {basePrice.toLocaleString("vi-VN")}₫
                    </option>
                  );
                })
              ) : (
                <option disabled>Đang tải danh sách gói giá...</option>
              )}
            </select>

            {/* Chi tiết gói */}
            {selectedPackage && (
              <div className="mt-3 bg-gray-50 border rounded-md p-4 shadow-inner text-sm space-y-2 animate-fadeIn">
                {(() => {
                  const selected = packages.find((p) => p._id === selectedPackage);
                  if (!selected) return <p>Không tìm thấy thông tin gói.</p>;

                  const basePrice =
                    typeof selected.base_price === "object" && selected.base_price.$numberDecimal
                      ? Number(selected.base_price.$numberDecimal)
                      : Number(selected.base_price);

                  return (
                    <>
                      <p><strong>📦 Gói:</strong> {selected.name}</p>
                      <p><strong>👷 Nhân công:</strong> {selected.workers}</p>
                      <p><strong>🏢 Tầng tối đa:</strong> {selected.max_floor}</p>
                      <p><strong>⏱ Thời gian chờ:</strong> {selected.wait_time} phút</p>
                      <p><strong>💰 Cước cơ bản:</strong> {basePrice.toLocaleString("vi-VN")}₫</p>

                      {distanceText && form.total_price && (
                        <div className="mt-3 bg-white border rounded-lg p-3 shadow-sm leading-relaxed transition-all duration-300 animate-fadeIn">
                          <p className="flex items-center gap-2 text-gray-700">
                            <span className="text-pink-500 text-lg">📍</span>
                            <strong>Khoảng cách:</strong> {distanceText}
                          </p>
                          <p className="flex items-center gap-2 text-gray-700">
                            <span className="text-purple-500 text-lg">⏱</span>
                            <strong>Thời gian dự kiến:</strong> {durationText}
                          </p>
                          <p className="flex items-center gap-2 text-gray-700 font-semibold">
                            <span className="text-amber-500 text-lg">💰</span>
                            <strong>Giá tạm tính:</strong>{" "}
                            {parseFloat(form.total_price).toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Nút thao tác */}
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition-transform hover:scale-[1.02]"
            onClick={handleEstimatePrice}
            disabled={!form.pickup_address || !form.delivery_address || !selectedPackage}
          >
            🚀 Tính giá tự động
          </Button>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-2 rounded-lg shadow-lg hover:opacity-90 transition-all"
            disabled={loading}
          >
            {loading ? "Đang tạo đơn..." : "✅ Xác nhận đặt hàng"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
