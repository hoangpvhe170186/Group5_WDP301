// src/utils/loadGoogleMaps.ts

let googleMapsPromise: Promise<void> | null = null;
declare global {
  interface Window {
    google: any;
  }
}
/**
 * Hàm load script Google Maps API động, chỉ chạy 1 lần duy nhất
 */
export const loadGoogleMaps = (): Promise<void> => {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    // Nếu đã có sẵn đối tượng google
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDNI_ZWPqvdS6r6gPVO50I4TlYkfkZdXh8&libraries=places&language=vi&region=VN";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ Google Maps script loaded");
      resolve();
    };
    script.onerror = () => reject(new Error("Không thể tải Google Maps API"));

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
