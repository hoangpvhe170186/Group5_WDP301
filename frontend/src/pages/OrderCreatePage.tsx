"use client";

import { useState } from "react";
import OrderForm from "@/components/OrderForm";
import MapView from "@/components/MapView_Mapbox";

export default function OrderCreatePage() {
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState(0);

  return (
    <div className="flex flex-row h-screen">
      {/* Form bên trái */}
      <div className="w-1/3 bg-white p-4 overflow-y-auto">
        <OrderForm
          onAddressChange={(p, d) => {
            setPickup(p);
            setDelivery(d);
          }}
          onEstimate={(dist, dur, fee) => {
            setDistance(dist);
            setDuration(dur);
            setPrice(fee);
          }}
        />

        {distance && (
          <div className="mt-4 p-4 border rounded-md text-sm">
            <p>📍 Khoảng cách: {distance}</p>
            <p>⏱️ Thời gian dự kiến: {duration}</p>
            <p>💰 Giá tạm tính: {price.toLocaleString()} VNĐ</p>
          </div>
        )}
      </div>

      {/* Bản đồ bên phải */}
      <div className="w-2/3">
        <MapView
          pickup={pickup}
          delivery={delivery}
          onAddressSelect={(type, address) => {
            if (type === "pickup") setPickup(address);
            else setDelivery(address);
          }}
        />
      </div>
    </div>
  );
}