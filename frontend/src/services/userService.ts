import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Định nghĩa interface cho User
export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Seller' | 'Customer' | 'Driver' | 'Carrier';
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: string;
  updatedAt: string;
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
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  }

  // Lấy user theo ID
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await axios.get(`${API_BASE_URL}/users/${id}`);
    return response.data;
  }

  // Lấy users theo role
  async getUsersByRole(role: string): Promise<ApiResponse<User[]>> {
    const response = await axios.get(`${API_BASE_URL}/users/role/${role}`);
    return response.data;
  }

  // Lấy users theo status
  async getUsersByStatus(status: string): Promise<ApiResponse<User[]>> {
    const response = await axios.get(`${API_BASE_URL}/users/status/${status}`);
    return response.data;
  }
}

export default new UserService();
