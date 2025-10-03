import axios from 'axios';

// Prefer env-based base URL; fallback to local dev server
// Resolve base URL from Vite env if available (no 'any' usage)
type EnvWithApi = { env?: { VITE_API_BASE_URL?: string } };
const viteEnv = (import.meta as unknown as EnvWithApi).env;
const API_BASE_URL = (viteEnv && viteEnv.VITE_API_BASE_URL) || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Định nghĩa interface cho User
export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Seller' | 'Customer' | 'Driver' | 'Carrier';
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

class UserService {
  // Lấy danh sách tất cả users
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await api.get('/users');
    return response.data;
  }

  // Lấy user theo ID
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

}

export default new UserService();
