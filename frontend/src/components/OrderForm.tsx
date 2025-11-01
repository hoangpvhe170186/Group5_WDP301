"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface OrderFormProps {
  onAddressChange?: (pickup: string, delivery: string) => void;
  onEstimate?: (distance: string, duration: string, fee: number) => void;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoicXVhbmcxOTExIiwiYSI6ImNtZ3Bjc2hkNTI3N2Yybm9raGN5NTk2M2oifQ.mtyOW12zbuT7eweGm3qO9w";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function OrderForm({ onAddressChange, onEstimate }: Readonly<OrderFormProps>) {
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
  const hasSavedOrder = !!localStorage.getItem("orderFormData");
  const pickupGeoRef = useRef<HTMLDivElement | null>(null);
  const deliveryGeoRef = useRef<HTMLDivElement | null>(null);
  const pickupGeocoderRef = useRef<any>(null);
  const deliveryGeocoderRef = useRef<any>(null);
  const location = useLocation();
  const storedOrderData = localStorage.getItem("orderFormData");
  const parsedStoredData = storedOrderData ? JSON.parse(storedOrderData) : {};

  const {
    scheduleType = parsedStoredData.scheduleType || "now",
    deliveryTime = parsedStoredData.deliveryTime || null,
    selectedPackage: passedPackage = parsedStoredData.selectedPackage || "",
    extraFees: passedExtraFees = parsedStoredData.extraFees || [],
    totalFinal: passedTotalFinal = parsedStoredData.totalFinal || "",
  } = location.state || parsedStoredData || {};

  // 🧩 Khôi phục dữ liệu tạm khi load trang
  useEffect(() => {
    const savedForm = localStorage.getItem("orderFormData");
    if (!savedForm) return;

    const parsedForm = JSON.parse(savedForm);
    setForm(parsedForm);

    if (parsedForm.selectedPackage) setSelectedPackage(parsedForm.selectedPackage);
    if (parsedForm.extraFees) setExtraFees(parsedForm.extraFees);

    // 🕒 Đảm bảo Mapbox đã khởi tạo xong trước khi setInput
    const waitForGeocoder = setInterval(() => {
      if (pickupGeocoderRef.current && deliveryGeocoderRef.current) {
        if (parsedForm.pickup_address)
          pickupGeocoderRef.current.setInput(parsedForm.pickup_address);
        if (parsedForm.delivery_address)
          deliveryGeocoderRef.current.setInput(parsedForm.delivery_address);
        clearInterval(waitForGeocoder); // dừng vòng lặp
      }
    }, 300);

    // cleanup để tránh memory leak
    return () => clearInterval(waitForGeocoder);
  }, []);

  // 🧩 Lưu dữ liệu tạm vào localStorage mỗi khi thay đổi
  useEffect(() => {
    const northernProvinces = [
      "Hà Nội", "Bắc Ninh", "Bắc Giang", "Hải Dương", "Hải Phòng", "Hưng Yên",
      "Vĩnh Phúc", "Phú Thọ", "Thái Nguyên", "Bắc Kạn", "Tuyên Quang", "Yên Bái",
      "Lào Cai", "Lạng Sơn", "Quảng Ninh", "Hòa Bình", "Sơn La", "Điện Biên",
      "Lai Châu", "Cao Bằng"
    ];

    const isPickupNorth = northernProvinces.some(p => form.pickup_address.includes(p));
    const isDeliveryNorth = northernProvinces.some(p => form.delivery_address.includes(p));

    // ✅ Chỉ lưu nếu cả hai địa chỉ đều nằm trong miền Bắc
    if (isPickupNorth && isDeliveryNorth) {
      const fullOrderData = {
        ...form,
        selectedPackage: selectedPackage || "",
        extraFees: extraFees || [],
        totalFinal: parseFloat(form.total_price || "0") +
          extraFees.reduce((sum, f) => sum + Number(f.price?.$numberDecimal || f.price), 0),
        scheduleType,
        deliveryTime,
      };

      localStorage.setItem("orderFormData", JSON.stringify(fullOrderData));
      console.log("✅ Đã lưu toàn bộ thông tin gói vào orderFormData:", fullOrderData);
    } else {
      console.warn("🚫 Không lưu vì địa chỉ nằm ngoài phạm vi miền Bắc Việt Nam!");
    }
  }, [form, selectedPackage, extraFees, scheduleType, deliveryTime]);

  // 🧩 Load lại khi quay về từ trang khác (vẫn giữ dữ liệu cũ)
  useEffect(() => {
    const data = location.state;
    if (!data) return;

    setForm((prev) => ({
      ...prev,
      pickup_address: data.pickup_address || prev.pickup_address,
      pickup_detail: data.pickup_detail || prev.pickup_detail,
      delivery_address: data.delivery_address || prev.delivery_address,
      phone: data.phone || prev.phone,
      total_price: data.totalFinal?.toString() || prev.total_price,
    }));

    if (data.selectedPackage) setSelectedPackage(data.selectedPackage);
    if (data.extraFees) setExtraFees(data.extraFees);
  }, [location.state]);

  useEffect(() => {
    const fetchPackages = async () => {
      const res = await axios.get("http://localhost:4000/api/pricing");
      setPackages(res.data?.packages || []);
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    if (!pickupGeoRef.current || !deliveryGeoRef.current) return;

    const opts = { accessToken: MAPBOX_TOKEN, mapboxgl, marker: false, language: "vi", countries: "VN" };

    const pickupGeocoder = new MapboxGeocoder({ ...opts, placeholder: "Nhập địa chỉ lấy hàng..." });
    const deliveryGeocoder = new MapboxGeocoder({ ...opts, placeholder: "Nhập địa chỉ giao hàng..." });

    pickupGeocoder.addTo(pickupGeoRef.current);
    deliveryGeocoder.addTo(deliveryGeoRef.current);
    pickupGeocoderRef.current = pickupGeocoder;
    deliveryGeocoderRef.current = deliveryGeocoder;
    pickupGeocoder.on("result", (e) => {
      const address = e.result?.place_name || "";

      setForm((prev) => {
        if (prev.delivery_address && prev.delivery_address.trim() === address.trim()) {
          alert(" Địa chỉ lấy hàng và giao hàng không được trùng nhau!");
          return prev; // không cập nhật
        }
        onAddressChange?.(address, prev.delivery_address);
        return { ...prev, pickup_address: address };
      });
    });

    deliveryGeocoder.on("result", (e) => {
      const address = e.result?.place_name || "";

      setForm((prev) => {
        if (prev.pickup_address && prev.pickup_address.trim() === address.trim()) {
          alert("Địa chỉ giao hàng không được trùng với địa chỉ lấy hàng!");
          return prev; // không cập nhật
        }
        onAddressChange?.(prev.pickup_address, address);
        return { ...prev, delivery_address: address };
      });
    });

    return () => {
      pickupGeocoder.onRemove();
      deliveryGeocoder.onRemove();
    };
  }, []);

  const validPrefixes = ["03", "05", "07", "08", "09", "012", "016", "018", "019"];

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "").slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, phone: cleaned }));
  };

  const handleEstimatePrice = async () => {
    if (!form.pickup_address || !form.delivery_address || !selectedPackage) return;
    if (form.pickup_address.trim() === form.delivery_address.trim()) {
      alert("Địa chỉ lấy hàng và giao hàng không được trùng nhau.");
      return;
    }
    const res = await axios.post("http://localhost:4000/api/pricing/estimate2", {
      pickup_address: form.pickup_address,
      delivery_address: form.delivery_address,
      pricepackage_id: selectedPackage,
      max_floor: customFloor || undefined,
    });

    if (!res.data?.success) return;
    setForm((prev) => ({ ...prev, total_price: String(res.data.data.totalFee) }));
    setDistanceText(res.data.data.distance.text);
    setDurationText(res.data.data.duration.text);
    onEstimate?.(res.data.data.distance.text, res.data.data.duration.text, res.data.data.totalFee);
  };

  useEffect(() => {
    if (form.pickup_address && form.delivery_address && selectedPackage) handleEstimatePrice();
  }, [form.pickup_address, form.delivery_address, selectedPackage, customFloor]);

  const totalExtra = extraFees.reduce((sum, f) => sum + Number(f.price?.$numberDecimal || f.price), 0);
  const totalFinal = parseFloat(form.total_price || "0") + totalExtra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.pickup_address.trim() === form.delivery_address.trim()) {
      alert("Địa chỉ lấy hàng và giao hàng không được trùng nhau.");
      return;
    }

    const phone = form.phone;
    if (phone.length !== 10) {
      alert("Số điện thoại phải gồm đúng 10 số!");
      return;
    }

    const prefix2 = phone.slice(0, 2);
    const prefix3 = phone.slice(0, 3);
    if (!validPrefixes.includes(prefix2) && !validPrefixes.includes(prefix3)) {
      alert("Đầu số điện thoại không hợp lệ!");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("auth_token");

    try {
      const res = await axios.post(
        "http://localhost:4000/api/orders",
        {
          customer_id: user_id,
          pickup_address: form.pickup_address,
          pickup_detail: form.pickup_detail,
          delivery_address: form.delivery_address,
          total_price: passedTotalFinal || totalFinal,
          package_id: selectedPackage || passedPackage,
          phone: form.phone,
          scheduleType,
          scheduled_time: deliveryTime || null, // ✅ Gửi lịch giao hàng
          extra_fees: extraFees.length > 0 ? extraFees.map((f) => f._id) : (passedExtraFees.map((f) => f._id) || []),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        // ✅ Xóa dữ liệu tạm
        localStorage.removeItem("orderFormData");
        localStorage.removeItem("selectedPackage");
        localStorage.removeItem("extraFees");

        alert("🎉 Đặt hàng thành công! Cảm ơn bạn đã sử dụng dịch vụ.");
        navigate("/"); // 🔁 Quay lại trang chủ
      }
    } catch (err) {
      console.error(err);
      alert(" Đặt hàng thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Hàm reset form
  const handleReset = () => {
    if (confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu đã nhập không?")) {
      // 🧹 Xóa dữ liệu trong localStorage
      localStorage.removeItem("orderFormData");
      localStorage.removeItem("selectedPackage");
      localStorage.removeItem("extraFees");

      // 🧹 Reset toàn bộ form và state
      setForm({
        pickup_address: "",
        pickup_detail: "",
        delivery_address: "",
        total_price: "",
        phone: "",
      });
      setSelectedPackage("");
      setExtraFees([]);

      // 🧹 Xóa input mapbox
      if (pickupGeocoderRef.current) pickupGeocoderRef.current.setInput("");
      if (deliveryGeocoderRef.current) deliveryGeocoderRef.current.setInput("");

      // 🚀 Điều hướng lại trang hiện tại và xóa state của React Router
      navigate("/dat-hang", { replace: true, state: {} });

      alert("✅ Đã xóa toàn bộ dữ liệu tạm và thông tin gói dịch vụ.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>

        {/* 🧩 Nút reset dữ liệu */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Nhập lại từ đầu
        </button>
      </div>

      <h2 className="text-2xl font-bold text-orange-500 mb-6 text-center"> Đặt giao hàng</h2>
      {/* Thông tin gói & lịch giao hàng */}
      <div className="mb-6 border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-800 text-lg"> Thông tin gói dịch vụ</h3>
        <Button
          variant="outline"
          disabled={!hasSavedOrder}
          className={`mt-4 w-full border-orange-400 ${hasSavedOrder
            ? "text-orange-600 hover:bg-orange-50"
            : "text-gray-400 border-gray-300 cursor-not-allowed"
            }`}
          onClick={() => {
            if (!hasSavedOrder) {
              alert("⚠️ Bạn chưa có dữ liệu để chỉnh sửa. Vui lòng xem giá trước khi chỉnh sửa!");
              return;
            }

            navigate("/estimate-price", {
              state: {
                pickup_address: form.pickup_address,
                delivery_address: form.delivery_address,
                pickup_detail: form.pickup_detail,
                phone: form.phone,
              },
            });
          }}
        >
          Chỉnh sửa gói dịch vụ / phụ phí
        </Button>
        {passedPackage ? (
          <>
            {(() => {
              const foundPackage = packages.find(pkg => pkg._id === (selectedPackage || passedPackage));
              return (
                <p>
                  <strong>Gói dịch vụ:</strong>{" "}
                  {foundPackage ? foundPackage.name : "Không xác định"}
                </p>
              );
            })()}
            <p><strong>Tổng tiền:</strong> {Number(passedTotalFinal).toLocaleString("vi-VN")}₫</p>
            {passedExtraFees.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-gray-700">Phụ phí đi kèm:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {passedExtraFees.map((fee, idx) => (
                    <li key={idx}>
                      {fee.name}: +{Number(fee.price?.$numberDecimal || fee.price).toLocaleString("vi-VN")}₫
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500"></p>
        )}

        <hr className="my-3" />

        <h3 className="font-bold text-gray-800 text-lg">Lịch giao hàng</h3>
        {scheduleType === "now" ? (
          <p>
            Giao ngay - dự kiến{" "}
            <strong>
              {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </strong>
          </p>
        ) : deliveryTime ? (
          <p>
            Giao vào lúc{" "}
            <strong>
              {new Date(deliveryTime).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </strong>
          </p>
        ) : (
          <p className="text-gray-500">Chưa chọn lịch giao hàng.</p>
        )}

      </div>
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col flex-1">
        <div>
          <Label>Địa chỉ lấy hàng</Label>
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
          <Label>Địa chỉ giao hàng</Label>
          <div ref={deliveryGeoRef} className="mt-2 w-full mapbox-container relative z-10"></div>
        </div>

        <input
          type="tel"
          maxLength={12}
          className="border border-gray-300 rounded-lg p-2 w-full"
          placeholder="Nhập số điện thoại..."
          value={formatPhone(form.phone)}
          onChange={(e) => handlePhoneChange(e.target.value)}
          required
        />

        <Button
          type="button"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg"
          onClick={() => {
            // ⚙️ Kiểm tra địa chỉ
            if (!form.pickup_address || !form.delivery_address) {
              const defaultVehicleId = "68e23b3c43b598cadadcc79a";
              navigate(`/vehicles/${defaultVehicleId}/price`);
              return;
            }
            const northernProvinces = [
              "Hà Nội", "Bắc Ninh", "Bắc Giang", "Hải Dương", "Hải Phòng", "Hưng Yên",
              "Vĩnh Phúc", "Phú Thọ", "Thái Nguyên", "Bắc Kạn", "Tuyên Quang", "Yên Bái",
              "Lào Cai", "Lạng Sơn", "Quảng Ninh", "Hòa Bình", "Sơn La", "Điện Biên",
              "Lai Châu", "Cao Bằng"
            ];

            const isPickupNorth = northernProvinces.some(p =>
              form.pickup_address.includes(p)
            );
            const isDeliveryNorth = northernProvinces.some(p =>
              form.delivery_address.includes(p)
            );

            if (!isPickupNorth || !isDeliveryNorth) {
              alert("⚠️ Địa chỉ lấy hàng hoặc giao hàng nằm ngoài phạm vi miền Bắc Việt Nam. Vui lòng chọn lại!");
              return;
            }

            // ⚙️ Kiểm tra số điện thoại
            if (!form.phone.trim()) {
              alert("Vui lòng nhập số điện thoại trước khi xem giá.");
              return;
            }

            if (form.phone.length !== 10) {
              alert("Số điện thoại phải gồm đúng 10 số.");
              return;
            }

            const validPrefixes = ["03", "05", "07", "08", "09", "012", "016", "018", "019"];
            const prefix2 = form.phone.slice(0, 2);
            const prefix3 = form.phone.slice(0, 3);
            if (!validPrefixes.includes(prefix2) && !validPrefixes.includes(prefix3)) {
              alert("Đầu số điện thoại không hợp lệ!");
              return;
            }

            // ⚙️ Nếu hợp lệ -> chuyển sang trang xem giá
            navigate("/estimate-price", {
              state: {
                pickup_address: form.pickup_address,
                delivery_address: form.delivery_address,
                pickup_detail: form.pickup_detail,
                phone: form.phone,
              },
            });
          }}
        >
          Xem giá
        </Button>

        <Button
          type="submit"
          className={`w-full ${form.total_price ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-400 cursor-not-allowed"
            } text-white font-semibold py-2 rounded-lg shadow-lg`}
          disabled={!form.total_price || loading}
        >
          {loading ? "Đang xử lý..." : "Xác nhận đơn hàng "}
        </Button>
      </form>
    </div>
  );
}
