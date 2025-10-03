import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import userService, { type User } from '../services/userService';
import { User as UserIcon, Mail, Phone, Edit3, Key, Trash2, Settings } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const actualUserId = userId || "68dfd5144e122996f40a9b21";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUserById(actualUserId);
      if (response.success) {
        setUser(response.data);
      } else {
        setError(response.message || 'Không thể tải thông tin user');
      }
    } catch (err: unknown) {
      let message = 'Lỗi kết nối đến server';
      if (typeof err === 'object' && err !== null) {
        const anyErr = err as { response?: { data?: { message?: string } } };
        if (anyErr.response?.data?.message) {
          message = anyErr.response.data.message;
        }
      }
      setError(message);
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [actualUserId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Seller': return 'bg-blue-100 text-blue-800';
      case 'Customer': return 'bg-green-100 text-green-800';
      case 'Driver': return 'bg-yellow-100 text-yellow-800';
      case 'Carrier': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow">
          <p className="font-bold">Lỗi!</p>
          <p>{error}</p>
          <button 
            onClick={fetchUser}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy thông tin user</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Chức năng</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <button
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                >
                  <Edit3 className="h-4 w-4 mr-3" />
                  Chỉnh sửa thông tin
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg">
                  <Key className="h-4 w-4 mr-3" />
                  Đổi mật khẩu
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg">
                  <Settings className="h-4 w-4 mr-3" />
                  Cài đặt tài khoản
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-lg">
                  <Trash2 className="h-4 w-4 mr-3" />
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Main Profile */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-xl mb-6">
              <div className="px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start">
                
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.full_name}
                      className="h-28 w-28 rounded-full border-4 border-white shadow-md object-cover"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
                      <UserIcon className="h-12 w-12 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mt-6 sm:mt-0 sm:ml-8 flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.full_name}
                  </h1>

                  <div className="flex justify-center sm:justify-start items-center mb-4 space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-center sm:justify-start">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      {user.email}
                    </div>

                    <div className="flex items-center justify-center sm:justify-start">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      {user.phone}
                    </div>
                  </div>

                  
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
