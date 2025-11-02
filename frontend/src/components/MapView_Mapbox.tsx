"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map, Marker, LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

interface MapViewProps {
  pickup: string;
  delivery: string;
  onAddressSelect?: (type: "pickup" | "delivery", address: string) => void;
  onRouteCalculated?: (distanceKm: number, durationMin: number) => void;
}

const MAPBOX_TOKEN =
  (import.meta.env as any).VITE_MAPBOX_ACCESS_TOKEN ||
  (import.meta.env as any).VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoicXVhbmcxOTExIiwiYSI6ImNtZ3Bjc2hkNTI3N2Yybm9raGN5NTk2M2oifQ.mtyOW12zbuT7eweGm3qO9w";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapView_Mapbox({
  pickup,
  delivery,
  onAddressSelect,
  onRouteCalculated,
}: Readonly<MapViewProps>) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [pickupMarker, setPickupMarker] = useState<Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // ✅ Giới hạn phạm vi miền Bắc Việt Nam
  const northVNBounds: [number, number, number, number] = [
    101.5, 20.6, // Tây Nam
    109.5, 23.5, // Đông Bắc
  ];

  const isInsideNorthVN = (lng: number, lat: number) => {
    const [minLng, minLat, maxLng, maxLat] = northVNBounds;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  };

  // --- Khởi tạo Map ---
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [105.8542, 21.0285], // Hà Nội
      zoom: 8,
      maxBounds: northVNBounds, // ✅ Giới hạn vùng hiển thị
    });
    mapRef.current = map;

    map.on("load", () => {
      setIsMapLoaded(true);

      if (!map.getSource("route")) {
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        });
      }
      if (!map.getLayer("route-line")) {
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#2563eb", "line-width": 6, "line-opacity": 0.8 },
        });
      }
    });
    
    

    // ✅ Click chọn vị trí
    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;

      if (!isInsideNorthVN(lng, lat)) {
        alert(" Vị trí bạn chọn nằm ngoài phạm vi miền Bắc Việt Nam!");
        return;
      }

      try {
        const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
        const { data } = await axios.get(geoUrl, {
          params: { access_token: MAPBOX_TOKEN, language: "vi", limit: 1 },
        });

        const address = data?.features?.[0]?.place_name;
        if (!address) return;

        const confirmPickup = window.confirm(
          `Bạn muốn chọn địa chỉ:\n"${address}"\nlàm điểm LẤY HÀNG?\n\n(Nhấn Cancel để chọn làm điểm GIAO HÀNG)`
        );

        if (confirmPickup) {
          pickupMarker?.remove();
          const mk = new mapboxgl.Marker({ color: "#FF4136" })
            .setLngLat([lng, lat])
            .addTo(map);
          setPickupMarker(mk);
          onAddressSelect?.("pickup", address);
        } else {
          deliveryMarker?.remove();
          const mk = new mapboxgl.Marker({ color: "#0074D9" })
            .setLngLat([lng, lat])
            .addTo(map);
          setDeliveryMarker(mk);
          onAddressSelect?.("delivery", address);
        }
      } catch {
        alert("Không thể lấy thông tin địa chỉ tại vị trí này.");
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Geocode địa chỉ ---
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
      const { data } = await axios.get(geoUrl, {
        params: { access_token: MAPBOX_TOKEN, limit: 1, language: "vi", country: "VN" },
      });

      const feature = data?.features?.[0];
      if (!feature?.center) return null;

      const [lng, lat] = feature.center;
      if (!isInsideNorthVN(lng, lat)) {
        alert(` Địa chỉ "${address}" nằm ngoài phạm vi miền Bắc Việt Nam!`);
        return null;
      }

      return [lng, lat];
    } catch (err) {
      console.error(" Geocoding lỗi:", err);
      return null;
    }
  };

  // --- Vẽ route ---
  const drawRoute = async () => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !pickup || !delivery) return;

    const [origCoord, destCoord] = await Promise.all([
      geocodeAddress(pickup),
      geocodeAddress(delivery),
    ]);

    if (!origCoord || !destCoord) return;

    try {
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origCoord[0]},${origCoord[1]};${destCoord[0]},${destCoord[1]}`;
      const { data } = await axios.get(directionsUrl, {
        params: { access_token: MAPBOX_TOKEN, geometries: "geojson", language: "vi", overview: "full" },
      });

      const route = data?.routes?.[0];
      if (!route?.geometry?.coordinates) {
        alert("Không tìm thấy tuyến đường phù hợp giữa hai địa chỉ.");
        return;
      }

      const coords = route.geometry.coordinates;
      const source = map.getSource("route") as mapboxgl.GeoJSONSource;
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      });

      // Marker
      pickupMarker?.remove();
      deliveryMarker?.remove();
      setPickupMarker(new mapboxgl.Marker({ color: "#FF4136" }).setLngLat(origCoord).addTo(map));
      setDeliveryMarker(new mapboxgl.Marker({ color: "#0074D9" }).setLngLat(destCoord).addTo(map));

      // Fit map
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c: [number, number]) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 60, duration: 1000 });

      // Overlay distance/time
      const distanceKm = route.distance / 1000;
      const durationMin = route.duration / 60;
      if (!overlayRef.current) {
        const div = document.createElement("div");
        div.className = "absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md font-semibold text-sm z-10";
        overlayRef.current = div;
        map.getContainer().appendChild(div);
      }
      overlayRef.current.innerText = `🚗 ${distanceKm.toFixed(1)} km ~ ${Math.round(durationMin)} phút`;

      onRouteCalculated?.(distanceKm, durationMin);
    } catch (err) {
      console.error("❌ Lỗi Directions:", err);
      alert("Không thể tìm đường đi hợp lệ.");
    }
  };

  useEffect(() => {
    if (pickup && delivery && isMapLoaded) {
      drawRoute();
    } else {
      const map = mapRef.current;
      if (map && isMapLoaded) {
        const source = map.getSource("route") as mapboxgl.GeoJSONSource;
        source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
        overlayRef.current?.remove();
        overlayRef.current = null;
      }
    }
  }, [pickup, delivery, isMapLoaded]);

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
}
