import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";

export type DistanceMatrixResult = {
  distanceKm: number;
  durationMin: number;
  text: {
    distance: string;
    duration: string;
  };
};

/**
 * Hàm tính khoảng cách & thời gian giữa 2 địa chỉ bằng Mapbox Directions API
 */
export async function getDistanceMatrix(
  origin: string,
  destination: string
): Promise<DistanceMatrixResult> {
  try {
    // B1. Geocoding để chuyển địa chỉ → toạ độ (lat,lng)
    const geocode = async (address: string) => {
      const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json`;
      const { data } = await axios.get(geoUrl, {
        params: { access_token: MAPBOX_TOKEN, limit: 1, language: "vi" },
      });

      if (!data.features || data.features.length === 0)
        throw new Error("Không tìm thấy vị trí cho địa chỉ: " + address);

      return data.features[0].center; // [lng, lat]
    };

    const [originCoord, destinationCoord] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ]);

    // B2. Gọi Directions API để lấy khoảng cách & thời gian
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoord[0]},${originCoord[1]};${destinationCoord[0]},${destinationCoord[1]}`;
    const { data } = await axios.get(directionsUrl, {
      params: { access_token: MAPBOX_TOKEN, language: "vi" },
    });

    if (!data.routes || data.routes.length === 0)
      throw new Error("Không thể tìm tuyến đường giữa hai địa chỉ");

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
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi Mapbox API:", err.message);
    throw new Error(err.message || "Không thể tính khoảng cách với Mapbox");
  }
}