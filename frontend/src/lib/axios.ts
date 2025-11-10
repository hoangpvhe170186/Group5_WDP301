import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api",
  withCredentials: false, // Giữ nguyên theo cấu hình của bạn
  timeout: 10000, // Thêm timeout để tránh request treo
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor request
api.interceptors.request.use(
  (config) => {
    // Lấy token từ nhiều nguồn khác nhau (giống với admin.service.ts)
    const getAuthToken = (): string => {
      if (typeof window === "undefined") return "";
      return (
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("auth_token") ||
        ""
      );
    };

    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung
    if (error.response?.status === 401) {
      // Token không hợp lệ hoặc hết hạn
      console.warn("Token không hợp lệ, xóa token và chuyển hướng đến login");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      sessionStorage.removeItem("auth_token");
      
      // Chuyển hướng đến trang login nếu đang ở client side
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    // Xử lý lỗi mạng
    if (!error.response) {
      console.error("Lỗi kết nối mạng:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;