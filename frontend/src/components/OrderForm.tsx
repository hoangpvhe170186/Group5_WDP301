"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate,Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ExtraFeeSelector from "./ExtraFeeSelector";
import { ArrowLeft } from "lucide-react";

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
  const [customFloor, setCustomFloor] = useState<number | null>(null);
  const [extraFees, setExtraFees] = useState<any[]>([]);
  const [form, setForm] = useState({
    pickup_address: "",
    pickup_detail: "",
    delivery_address: "",
    total_price: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  const pickupGeoRef = useRef<HTMLDivElement | null>(null);
  const deliveryGeoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/pricing");
        setPackages(res.data?.packages || []);
      } catch (error) {
        console.error(" Lỗi khi tải danh sách gói giá:", error);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    if (!pickupGeoRef.current || !deliveryGeoRef.current) return;
    const opts = {
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false,
      language: "vi",
      countries: "VN",
    };
    const pickupGeocoder = new MapboxGeocoder({
      ...opts,
      placeholder: " Nhập địa chỉ lấy hàng...",
    });
    const deliveryGeocoder = new MapboxGeocoder({
      ...opts,
      placeholder: " Nhập địa chỉ giao hàng...",
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
      pickupGeocoder.onRemove();
      deliveryGeocoder.onRemove();
    };
  }, []);

  const handleEstimatePrice = async () => {
    if (!form.pickup_address || !form.delivery_address || !selectedPackage) return;
    try {
      const res = await axios.post("http://localhost:4000/api/pricing/estimate2", {
        pickup_address: form.pickup_address,
        delivery_address: form.delivery_address,
        pricepackage_id: selectedPackage,
        max_floor: customFloor || undefined,
      });
      if (!res.data?.success) return alert(res.data?.message || "Không thể tính giá");
      const data = res.data.data;
      setForm((prev) => ({ ...prev, total_price: String(data.totalFee) }));
      setDistanceText(data.distance.text);
      setDurationText(data.duration.text);
      onEstimate?.(data.distance.text, data.duration.text, data.totalFee);
    } catch (err) {
      console.error(" Lỗi khi tính giá:", err);
      alert("Không thể tính giá tự động");
    }
  };

  useEffect(() => {
    if (form.pickup_address && form.delivery_address && selectedPackage)
      handleEstimatePrice();
  }, [form.pickup_address, form.delivery_address, selectedPackage, customFloor]);

  const totalExtra = extraFees.reduce(
    (sum, fee) => sum + Number(fee.price?.$numberDecimal || fee.price || 0),
    0
  );
  const totalFinal = parseFloat(form.total_price || "0") + totalExtra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(form.phone)) {
      alert("Vui lòng nhập số điện thoại hợp lệ!");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập trước khi đặt hàng!");
      const res = await axios.post(
        "http://localhost:4000/api/orders/temporary",
        {
          customer_id: user_id,
          pickup_address: form.pickup_address,
          pickup_detail: form.pickup_detail,
          delivery_address: form.delivery_address,
          total_price: totalFinal,
          package_id: selectedPackage,
          phone: form.phone,
          max_floor: customFloor || undefined,
          extra_fees: extraFees.map((f) => ({
            id: f._id,
            name: f.name,
            price: Number(f.price?.$numberDecimal || f.price),
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        const orderId = res.data.order._id;
        navigate(`/order-preview?orderId=${orderId}`);
      }
    } catch (err) {
      console.error("❌ Lỗi khi tạo đơn:", err);
      alert("Không thể tạo đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div >
      <div className="flex justify-between items-center mb-6">
        <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors"
        >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
        </Link>
      </div>
      <h2 className="text-2xl font-bold text-orange-500 mb-6 text-center">
        🧾 Đặt giao hàng
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col flex-1">
        <div>
          <Label> Địa chỉ lấy hàng</Label>
          <div ref={pickupGeoRef} className="mt-2 w-full mapbox-container relative z-20"></div>
          <input
            type="text"
            placeholder="Nhập chi tiết (Số nhà, tầng, tòa nhà...)"
            className="mt-2 w-full border border-gray-300 rounded-lg p-2"
            value={form.pickup_detail}
            onChange={(e) => setForm((prev) => ({ ...prev, pickup_detail: e.target.value }))}
          />
        </div>
        <div>
          <Label> Địa chỉ giao hàng</Label>
          <div ref={deliveryGeoRef} className="mt-2 w-full mapbox-container relative z-10"></div>
        </div>
        <div>
          <Label> Số điện thoại</Label>
          <input
            type="tel"
            className="border border-gray-300 rounded-lg p-2 w-full"
            placeholder="Nhập số điện thoại..."
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div>
        <Label> Chọn gói giá</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {packages.map((pkg) => {
            const isSelected = selectedPackage === pkg._id;
            const basePrice = Number(pkg.base_price?.$numberDecimal || pkg.base_price || 0);
            const vehicleInfo = pkg.vehicleInfo; 

            return (
              <div
                key={pkg._id}
                onClick={() => setSelectedPackage(pkg._id)}
                className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                  isSelected ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-300"
                }`}
              >
                {vehicleInfo?.image?.thumb && ( 
                  <img
                    src={vehicleInfo.image.thumb}
                    alt={pkg.name}
                    className="mx-auto h-12 mb-2 object-contain"
                  />
                )}
                <p className="font-semibold text-sm">{pkg.name}</p>
                {vehicleInfo?.capacity && ( 
                  <p className="text-xs text-gray-500">
                      {vehicleInfo.capacity >= 1000 ? `${vehicleInfo.capacity / 1000} tấn` : `${vehicleInfo.capacity}kg`}
                  </p>
                )}
                <p className="text-orange-500 font-bold mt-1">
                  {basePrice.toLocaleString("vi-VN")}₫
                </p>
              </div>
            );
          })}
        </div>
        {selectedPackage && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner text-sm space-y-1">
            {(() => {
              const selected = packages.find((p) => p._id === selectedPackage);
              if (!selected) return <p>Không tìm thấy thông tin gói.</p>;
              const basePrice = Number(selected.base_price?.$numberDecimal || selected.base_price || 0);
              const vehicleInfo = selected.vehicleInfo; 
              const specs = selected.specs; // ✅ Lấy dữ liệu specs

              return (
                <>
                  <p><strong>Gói:</strong> {selected.name}</p>
                  {vehicleInfo && ( 
                      <p><strong>Loại xe:</strong> {vehicleInfo.type} {vehicleInfo.capacity >= 1000 ? `${vehicleInfo.capacity / 1000} tấn` : `${vehicleInfo.capacity}kg`}</p>
                  )}
                  <p><strong>Nhân công:</strong> {selected.workers}</p>
                  <label className="block">
                    <strong>Tầng</strong>
                    <input
                      type="number"
                      min={1}
                      value={customFloor ?? selected.max_floor}
                      onChange={(e) => setCustomFloor(parseInt(e.target.value) || 1)}
                      className="w-20 ml-2 border border-gray-300 rounded px-2 py-1 text-center"
                    />
                  </label>
                  <p><strong>Thời gian xe chờ:</strong> {selected.wait_time} giờ</p>
                  <p><strong>Cước cơ bản:</strong> {basePrice.toLocaleString("vi-VN")}₫</p>
                  
                  {/* ✅ Hiển thị thông tin chi tiết từ specs */}
                  {specs && (
                    <div className="mt-3 pt-3 border-t">
                        <p><strong>Tải trọng tối đa:</strong> {specs.maxPayload}</p>
                        <p><strong>Kích thước thùng:</strong> {specs.innerSize}</p>
                        <p className="mt-1"><strong>Phù hợp:</strong></p>
                        <ul className="list-disc pl-5 text-gray-600">
                            {specs.suitable.map((item: string) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
        <ExtraFeeSelector onChange={setExtraFees} />
        {distanceText && form.total_price && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm mt-3">
            <p> Khoảng cách: {distanceText}</p>
            <p>Thời gian dự kiến: {durationText}</p>
            <p> Giá cơ bản: {parseFloat(form.total_price).toLocaleString("vi-VN")}₫</p>
            {extraFees.length > 0 && (
              <p> Phụ phí: {totalExtra.toLocaleString("vi-VN")}₫</p>
            )}
            <p className="text-lg font-semibold text-orange-600 mt-2">
              Tổng cộng: {totalFinal.toLocaleString("vi-VN")}₫
            </p>
          </div>
        )}
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg shadow-lg"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : " Tiếp theo"}
        </Button>
      </form>
    </div>
  );
}
