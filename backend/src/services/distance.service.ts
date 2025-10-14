// services/distance.service.ts
import axios from "axios";

import dotenv from "dotenv";
dotenv.config();

const MAPBOX_TOKEN =
  process.env.MAPBOX_TOKEN ||
  "pk.eyJ1IjoicXVhbmcxOTExIiwiYSI6ImNtZ3Bjc2hkNTI3N2Yybm9raGN5NTk2M2oifQ.mtyOW12zbuT7eweGm3qO9w";


export type DistanceMatrixResult = {
  distanceKm: number;
  durationMin: number;
  text: {
    distance: string;
    duration: string;
  };
};

export async function getDistanceMatrix(
  origin: string,
  destination: string
): Promise<DistanceMatrixResult> {
  // B1. Geocoding địa chỉ → toạ độ
  const geocode = async (address: string) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
    const { data } = await axios.get(url, {
      params: { access_token: MAPBOX_TOKEN, limit: 1, language: "vi", country: "VN" },
    });
    if (!data.features?.length) {
      throw new Error("Không tìm thấy vị trí cho địa chỉ: " + address);
    }
    return data.features[0].center as [number, number]; // [lng, lat]
  };

  const [orig, dest] = await Promise.all([geocode(origin), geocode(destination)]);

  // B2. Directions
  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${orig[0]},${orig[1]};${dest[0]},${dest[1]}`;
  const { data } = await axios.get(directionsUrl, {
    params: {
      access_token: MAPBOX_TOKEN,
      language: "vi",
      geometries: "geojson",
      overview: "full",
    },
  });

  if (!data.routes?.length) {
    throw new Error("Không thể tìm tuyến đường giữa hai địa chỉ");
  }

  const route = data.routes[0];
  const distanceKm = route.distance / 1000;
  const durationMin = route.duration / 60;

  return {
    distanceKm,
    durationMin,
    text: {
      distance: `${distanceKm.toFixed(2)} km`,
      duration: `${Math.round(durationMin)} phút`,
    },
  };
}
