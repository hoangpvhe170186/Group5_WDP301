"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

interface MapViewProps {
  pickup: string;
  delivery: string;
  onAddressSelect?: (type: "pickup" | "delivery", address: string) => void;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoicXVhbmcxOTExIiwiYSI6ImNtZ3Bjc2hkNTI3N2Yybm9raGN5NTk2M2oifQ.mtyOW12zbuT7eweGm3qO9w";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapView_Mapbox({ pickup, delivery, onAddressSelect }: Readonly<MapViewProps>) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [pickupMarker, setPickupMarker] = useState<Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<Marker | null>(null);

  // ✅ Khởi tạo MAP 1 lần duy nhất
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [105.8542, 21.0285],
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", () => {
      console.log("✅ Map loaded");

      // ✅ Thêm Source nếu chưa có
      if (!map.getSource("route")) {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [] },
            properties: {},
          },
        });
      }

      // ✅ Thêm Layer nếu chưa có
      if (!map.getLayer("route-line")) {
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.9 },
        });
      }

      // ✅ Nếu đã có địa chỉ sẵn → vẽ luôn route sau khi map load
      if (pickup && delivery) {
        setTimeout(() => {
          drawRouteSafe();
        }, 300);
      }
    });

    // ✅ Click trên Map chọn điểm
    map.on("click", async (e) => {
      const lngLat = e.lngLat;
      try {
        const { data } = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json`,
          { params: { access_token: MAPBOX_TOKEN, language: "vi", limit: 1 } }
        );
        const address = data?.features?.[0]?.place_name;
        if (!address) return;

        const confirmPickup = window.confirm(
          "Chọn làm địa chỉ LẤY HÀNG?\nNhấn Cancel nếu muốn chọn làm GIAO HÀNG."
        );

        if (confirmPickup) {
          pickupMarker?.remove();
          const mk = new mapboxgl.Marker({ color: "red" }).setLngLat(lngLat).addTo(map);
          setPickupMarker(mk);
          onAddressSelect?.("pickup", address);
        } else {
          deliveryMarker?.remove();
          const mk = new mapboxgl.Marker({ color: "blue" }).setLngLat(lngLat).addTo(map);
          setDeliveryMarker(mk);
          onAddressSelect?.("delivery", address);
        }
      } catch (err) {
        console.warn("Reverse geocoding failed", err);
      }
    });

    return () => {
      map.remove();
    };
  }, [onAddressSelect]);

  // ✅ VẼ ROUTE (version có SAFE Fallback)
  useEffect(() => {
    if (pickup && delivery) {
      drawRouteSafe();
    }
  }, [pickup, delivery]);

  async function drawRouteSafe() {
    const map = mapRef.current;
    if (!map) return;

    // Nếu map chưa load → retry sau 300ms
    if (!map.isStyleLoaded()) {
      console.log("⏳ Map style chưa load → retry...");
      return setTimeout(drawRouteSafe, 300);
    }

    try {
      // ✅ Geocode địa chỉ
      const geocode = async (query: string): Promise<[number, number]> => {
        const { data } = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
          { params: { access_token: MAPBOX_TOKEN, limit: 1, language: "vi", country: "VN" } }
        );
        const feat = data?.features?.[0];
        if (!feat) throw new Error("Không tìm thấy toạ độ cho: " + query);
        return feat.center;
      };

      const [orig, dest] = await Promise.all([geocode(pickup), geocode(delivery)]);

      // 🟢 Marker
      pickupMarker?.remove();
      deliveryMarker?.remove();
      setPickupMarker(new mapboxgl.Marker({ color: "red" }).setLngLat(orig).addTo(map));
      setDeliveryMarker(new mapboxgl.Marker({ color: "blue" }).setLngLat(dest).addTo(map));

      // 🚦 Directions
      const { data } = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${orig[0]},${orig[1]};${dest[0]},${dest[1]}`,
        { params: { access_token: MAPBOX_TOKEN, geometries: "geojson", language: "vi" } }
      );
      const route = data?.routes?.[0];
      const coords = route?.geometry?.coordinates || [];

      // ✅ LUÔN FORCE setData vào source
      const src: any = map.getSource("route");
      if (src) {
        src.setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
          properties: {},
        });
      } else {
        console.warn("⚠ Chưa thấy source 'route' → retry");
        return setTimeout(drawRouteSafe, 300);
      }

      // ✅ Fit Map
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c: [number, number]) => bounds.extend(c));

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, duration: 500 });
      }

      // ✅ Overlay Info km / минут
      if (!overlayRef.current) {
        const div = document.createElement("div");
        div.className =
          "absolute top-3 left-3 bg-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm";
        overlayRef.current = div;
        map.getContainer().appendChild(div);
      }
      overlayRef.current.innerText = `${(route.distance / 1000).toFixed(2)} km • ${Math.round(
        route.duration / 60
      )} phút`;

      console.log("✅ Route vẽ thành công");
    } catch (err) {
      console.warn("❌ Lỗi khi vẽ route:", err);
    }
  }

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
}
