"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map, Marker, LngLatBounds } from "mapbox-gl"; // Import thêm LngLatBounds
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

interface MapViewProps {
  pickup: string;
  delivery: string;
  onAddressSelect?: (type: "pickup" | "delivery", address: string) => void;
  // Thêm prop để nhận thông tin distance/duration (nếu cần hiển thị trên map)
  onRouteCalculated?: (distanceKm: number, durationMin: number) => void;
}

const MAPBOX_TOKEN =
  (import.meta.env as any).VITE_MAPBOX_ACCESS_TOKEN ||
  (import.meta.env as any).VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoicXVhbmcxOTExIiwiYSI6ImNtZ3Bjc2hkNTI3N2Yybm9raGN5NTk2M2oifQ.mtyOW12zbuT7eweGm3qO9w"; // Thay bằng token của bạn

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapView_Mapbox({
    pickup,
    delivery,
    onAddressSelect,
    onRouteCalculated // Nhận prop mới
}: Readonly<MapViewProps>) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [pickupMarker, setPickupMarker] = useState<Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false); // State theo dõi map đã load chưa

  // --- Khởi tạo Map ---
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Chỉ khởi tạo map một lần

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [105.8542, 21.0285], // Hà Nội
      zoom: 12,
    });
    mapRef.current = map;

    map.on("load", () => {
      console.log("✅ Map loaded");
      setIsMapLoaded(true); // Đánh dấu map đã sẵn sàng

      // Thêm Source và Layer cho đường đi
      if (!map.getSource("route")) {
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        });
      }
      if (!map.getLayer("route-line")) {
        map.addLayer({
          id: "route-line", type: "line", source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#2563eb", "line-width": 6, "line-opacity": 0.8 }, // Dày hơn chút
        });
      }
    });

    // Xử lý Click trên Map
    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      try {
        // Reverse Geocode: Tọa độ -> Địa chỉ
        const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
        const { data } = await axios.get(geoUrl, {
            params: { access_token: MAPBOX_TOKEN, language: "vi", limit: 1 }
        });
        const address = data?.features?.[0]?.place_name;
        if (!address) return;

        const confirmPickup = window.confirm(
          `Bạn muốn chọn địa chỉ:\n"${address}"\nlàm điểm LẤY HÀNG?\n\n(Nhấn Cancel để chọn làm điểm GIAO HÀNG)`
        );

        if (confirmPickup) {
          pickupMarker?.remove(); // Xóa marker cũ
          const mk = new mapboxgl.Marker({ color: "#FF4136" }) // Màu đỏ
            .setLngLat([lng, lat])
            .addTo(map);
          setPickupMarker(mk);
          onAddressSelect?.("pickup", address); // Thông báo cho component cha
        } else {
          deliveryMarker?.remove(); // Xóa marker cũ
          const mk = new mapboxgl.Marker({ color: "#0074D9" }) // Màu xanh
            .setLngLat([lng, lat])
            .addTo(map);
          setDeliveryMarker(mk);
          onAddressSelect?.("delivery", address); // Thông báo cho component cha
        }
      } catch (err) {
        console.warn("❌ Reverse geocoding failed:", err);
        alert("Không thể lấy thông tin địa chỉ tại vị trí này.");
      }
    });

    // Cleanup khi component unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Dependency rỗng để chỉ chạy 1 lần

  // --- Hàm Geocode ---
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      // ✅ Sửa URL Geocoding
      const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
      const { data } = await axios.get(geoUrl, {
        params: { access_token: MAPBOX_TOKEN, limit: 1, language: "vi", country: "VN" }
      });
      const feature = data?.features?.[0];
      if (!feature?.center) {
           console.warn(`Không tìm thấy tọa độ cho: ${address}`);
           return null; // Trả về null nếu không tìm thấy
      }
      return feature.center as [number, number]; // [lng, lat]
    } catch (error) {
        console.error(`❌ Lỗi Geocoding cho "${address}":`, error);
        return null; // Trả về null nếu có lỗi
    }
  };

  // --- Hàm Vẽ Route ---
  const drawRoute = async () => {
    const map = mapRef.current;
    // Chờ map load xong và có đủ 2 địa chỉ
    if (!map || !isMapLoaded || !pickup || !delivery) return;

    console.log("🔄 Drawing route for:", pickup, "->", delivery);

    try {
      // 1. Geocode cả 2 địa chỉ
      const [origCoord, destCoord] = await Promise.all([
          geocodeAddress(pickup),
          geocodeAddress(delivery)
      ]);

      // Nếu 1 trong 2 geocode thất bại -> dừng
      if (!origCoord || !destCoord) {
          alert("Không thể tìm thấy tọa độ cho một trong hai địa chỉ. Vui lòng kiểm tra lại.");
          // Xóa route cũ (nếu có)
          const source = map.getSource("route") as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
          }
           // Xóa overlay cũ
           overlayRef.current?.remove();
           overlayRef.current = null;
          return;
      }

      // 2. Gọi Directions API
      // ✅ Sửa URL Directions
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origCoord[0]},${origCoord[1]};${destCoord[0]},${destCoord[1]}`;
      const { data } = await axios.get(directionsUrl, {
        params: {
          access_token: MAPBOX_TOKEN,
          geometries: "geojson", // Lấy geometry để vẽ
          language: "vi",
          overview: "full" // Lấy đường đi chi tiết
        }
      });

      const route = data?.routes?.[0];
      if (!route?.geometry?.coordinates) {
        console.warn("Không tìm thấy tuyến đường.");
        alert("Không tìm thấy tuyến đường phù hợp giữa hai địa chỉ.");
        return;
      }
      const coords = route.geometry.coordinates;

      // 3. Cập nhật Source và Layer trên Map
      const source = map.getSource("route") as mapboxgl.GeoJSONSource; // Ép kiểu source
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
        console.log("✅ Route source updated");
      } else {
        // Trường hợp source chưa kịp tạo (hiếm khi xảy ra nếu map đã load)
        console.warn("Route source not ready, retrying...");
        setTimeout(drawRoute, 300); // Thử lại sau
        return;
      }

      // 4. Đặt lại Markers (để đảm bảo đúng vị trí geocode)
      pickupMarker?.remove();
      deliveryMarker?.remove();
      setPickupMarker(new mapboxgl.Marker({ color: "#FF4136" }).setLngLat(origCoord).addTo(map));
      setDeliveryMarker(new mapboxgl.Marker({ color: "#0074D9" }).setLngLat(destCoord).addTo(map));

      // 5. Fit Map vào Route
      const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
      coords.forEach((c: [number, number]) => bounds.extend(c));
      if (bounds && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, duration: 1000 }); // Thêm padding và duration
      }

      // 6. Hiển thị thông tin Khoảng cách & Thời gian
      const distanceKm = route.distance / 1000;
      const durationMin = route.duration / 60;

      if (!overlayRef.current) {
        const div = document.createElement("div");
        div.className = "absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md font-semibold text-sm z-10"; // Style đẹp hơn
        overlayRef.current = div;
        map.getContainer().appendChild(div);
      }
      overlayRef.current.innerText = `🚗 ${distanceKm.toFixed(1)} km ~ ${Math.round(durationMin)} phút`;

      // Thông báo cho component cha (nếu cần)
      onRouteCalculated?.(distanceKm, durationMin);

      console.log(`✅ Route drawn: ${distanceKm.toFixed(1)} km, ${Math.round(durationMin)} min`);

    } catch (err: any) {
      console.error("❌ Lỗi khi vẽ route:", err.response?.data || err.message || err);
       alert("Đã xảy ra lỗi khi tìm đường đi. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau.");
       // Xóa route cũ khi có lỗi
       const source = map.getSource("route") as mapboxgl.GeoJSONSource;
       if (source) {
         source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
       }
       overlayRef.current?.remove();
       overlayRef.current = null;
    }
  }

  // --- Trigger Vẽ Route khi địa chỉ thay đổi ---
  useEffect(() => {
    // Chỉ vẽ khi có cả 2 địa chỉ và map đã load
    if (pickup && delivery && isMapLoaded) {
      drawRoute();
    } else {
      // Nếu thiếu địa chỉ, xóa route và overlay cũ
      const map = mapRef.current;
      if (map && isMapLoaded) {
         const source = map.getSource("route") as mapboxgl.GeoJSONSource;
         if (source) {
           source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
         }
         overlayRef.current?.remove();
         overlayRef.current = null;
      }
    }
  }, [pickup, delivery, isMapLoaded]); // Thêm isMapLoaded dependency

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
}
