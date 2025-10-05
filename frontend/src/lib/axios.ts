import axios from 'axios';
// Dùng 'import type' cho kiểu AxiosInstance
import type { AxiosInstance } from 'axios';

const baseURL: string = 'http://localhost:4000/api'; 

// Tạo instance của axios với kiểu AxiosInstance
const api: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
