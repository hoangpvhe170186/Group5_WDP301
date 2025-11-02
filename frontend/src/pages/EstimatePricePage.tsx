"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ExtraFeeSelector from "@/components/ExtraFeeSelector";
import { ArrowLeft } from "lucide-react";

export default function EstimatePricePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { pickup_address, delivery_address, pickup_detail, phone } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState("");
    const [customFloor, setCustomFloor] = useState<number | null>(null);
    const [extraFees, setExtraFees] = useState<any[]>([]);
    const [distanceText, setDistanceText] = useState("");
    const [durationText, setDurationText] = useState("");
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [scheduleType, setScheduleType] = useState("now");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const totalExtra = extraFees.reduce((sum, f) => sum + Number(f.price?.$numberDecimal || f.price), 0);
    const totalFinal = totalPrice + totalExtra;

    useEffect(() => {
        const fetchPackages = async () => {
            const res = await axios.get("http://localhost:4000/api/pricing");
            setPackages(res.data?.packages || []);
        };
        fetchPackages();
    }, []);

    const handleEstimatePrice = async () => {
        if (!pickup_address || !delivery_address || !selectedPackage) return;

        const res = await axios.post("http://localhost:4000/api/pricing/estimate2", {
            pickup_address,
            delivery_address,
            pricepackage_id: selectedPackage,
            max_floor: customFloor || undefined,
        });

        if (res.data?.success) {
            setTotalPrice(res.data.data.totalFee);
            setDistanceText(res.data.data.distance.text);
            setDurationText(res.data.data.duration.text);
        }
    };

    useEffect(() => {
        if (pickup_address && delivery_address && selectedPackage) {
            handleEstimatePrice();
        }
    }, [pickup_address, delivery_address, selectedPackage, customFloor]);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
            </div>

            <h2 className="text-2xl font-bold text-orange-500 text-center mb-6">💰 Tính giá tham khảo</h2>

            {/* --- Gói giá --- */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 shadow-sm mt-6">
                <Label className="font-semibold text-gray-700 mb-2 block">
                    Thời gian giao hàng
                </Label>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <select
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-full md:w-1/2"
                    >
                        <option value="now">Giao ngay (1-2 giờ tùy tài xế)</option>
                        <option value="later">Đặt lịch giao</option>
                    </select>
                </div>

                {/* Nếu chọn đặt lịch thì hiện ô chọn ngày + giờ */}
                {scheduleType === "later" && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="font-semibold text-gray-700">Ngày giao</Label>
                            <input
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="font-semibold text-gray-700">Giờ giao</Label>
                            <input
                                type="time"
                                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                                value={scheduledTime}
                                min={
                                    scheduledDate === new Date().toISOString().split("T")[0]
                                        ? new Date().toLocaleTimeString("vi-VN", {
                                            hour12: false,
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : undefined
                                }
                                onChange={(e) => setScheduledTime(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
            <div>
                <Label>Chọn gói giá</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                    {packages.map((pkg) => {
                        const isSelected = selectedPackage === pkg._id;
                        const basePrice = Number(pkg.base_price?.$numberDecimal || pkg.base_price || 0);
                        const vehicleInfo = pkg.vehicleInfo;

                        return (
                            <div
                                key={pkg._id}
                                onClick={() => setSelectedPackage(pkg._id)}
                                className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${isSelected ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-300"
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

                {selectedPackage && (() => {
                    const selected = packages.find((p) => p._id === selectedPackage);
                    if (!selected) return null;
                    const basePrice = Number(selected.base_price?.$numberDecimal || selected.base_price || 0);
                    const vehicleInfo = selected.vehicleInfo;
                    const specs = selected.specs;

                    return (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner text-sm space-y-1">
                            <p><strong>Gói:</strong> {selected.name}</p>
                            {vehicleInfo && (
                                <p><strong>Loại xe:</strong> {vehicleInfo.type} {vehicleInfo.capacity >= 1000 ? `${vehicleInfo.capacity / 1000} tấn` : `${vehicleInfo.capacity}kg`}</p>
                            )}
                            <p><strong>Nhân công:</strong> {selected.workers}</p>
                            <label className="block">
                            </label>
                            <p><strong>Thời gian xe chờ:</strong> {selected.wait_time} giờ</p>
                            <p><strong>Cước cơ bản:</strong> {basePrice.toLocaleString("vi-VN")}₫</p>

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
                        </div>
                    );
                })()}
            </div>

            {/* --- Dịch vụ bổ sung --- */}
            <ExtraFeeSelector onChange={setExtraFees} />

            {/* --- Hiển thị kết quả tính giá --- */}
            {distanceText && totalPrice > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm mt-3">
                    <p>Khoảng cách: {distanceText}</p>
                    <p>Thời gian dự kiến: {durationText}</p>
                    <p>Giá cơ bản: {totalPrice.toLocaleString("vi-VN")}₫</p>
                    {extraFees.length > 0 && <p>Phụ phí: {totalExtra.toLocaleString("vi-VN")}₫</p>}
                    <p className="text-lg font-semibold text-orange-600 mt-2">
                        Tổng giá tham khảo: {totalFinal.toLocaleString("vi-VN")}₫
                    </p>
                </div>
            )}
            <Button
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg shadow-lg"
                onClick={() => {
                    let deliveryTime = null;
                    if (scheduleType === "later" && scheduledDate && scheduledTime) {
                        const chosen = new Date(`${scheduledDate}T${scheduledTime}`);
                        const now = new Date();

                        if (chosen.getTime() < now.getTime()) {
                            alert(" Không thể chọn thời gian trong quá khứ. Vui lòng chọn giờ khác!");
                            return; // Dừng lại, không cho chuyển tiếp
                        }

                        deliveryTime = chosen.toISOString();
                    }
                    navigate("/dat-hang", {
                        state: {
                            pickup_address,
                            delivery_address,
                            pickup_detail,
                            phone,
                            selectedPackage,
                            extraFees,
                            totalFinal,
                            scheduleType,
                            deliveryTime, // 👈 Gửi thêm thông tin lịch sang trang đặt hàng
                        },
                    });
                }}
                disabled={!selectedPackage || totalFinal === 0}
            >

                xác nhận giá tham khảo
            </Button>
        </div>
    );
}
