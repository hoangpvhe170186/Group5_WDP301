import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import userService, { type User } from '../services/userService';
import { User as UserIcon, Mail, Phone, Calendar, Edit3, Save, X, Key, Trash2, Settings } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  // Sử dụng ID cứng cho trang profile chính
  const actualUserId = userId || "68dd5b8b21d50ac94b841249";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUserById(actualUserId);
      if (response.success) {
        setUser(response.data);
        setEditData(response.data);
      } else {
        setError(response.message || 'Không thể tải thông tin user');
      }
    } catch (err) {
      setError('Lỗi kết nối đến server');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [actualUserId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(user || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user || {});
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Ở đây sẽ gọi API update user (chưa implement)
      console.log('Saving user data:', editData);
      
      // Tạm thời update local state
      if (user) {
        setUser({ ...user, ...editData });
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

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
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Lỗi!</p>
            <p>{error}</p>
            <button 
              onClick={fetchUser}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy thông tin user</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Chức năng */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Chức năng</h3>
              </div>
              <div className="px-6 py-4 space-y-2">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  <Edit3 className="h-4 w-4 mr-3" />
                  Chỉnh sửa thông tin
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md">
                  <Key className="h-4 w-4 mr-3" />
                  Đổi mật khẩu
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md">
                  <Settings className="h-4 w-4 mr-3" />
                  Cài đặt tài khoản
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-md">
                  <Trash2 className="h-4 w-4 mr-3" />
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Thông tin Profile */}
          <div className="lg:col-span-3">
            {/* Header với Avatar và Thông tin cơ bản */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-8">
                <div className="flex items-center">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Thông tin cơ bản */}
                  <div className="ml-6 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.full_name || ''}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 text-3xl font-bold"
                        />
                      ) : (
                        user.full_name
                      )}
                    </h1>
                    
                    <div className="flex items-center mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>

                    {/* Email và Phone */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        {isEditing ? (
                          <input
                            type="email"
                            value={editData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1 flex-1"
                          />
                        ) : (
                          <span className="text-gray-900 text-lg">{user.email}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1 flex-1"
                          />
                        ) : (
                          <span className="text-gray-900 text-lg">{user.phone || 'Chưa cập nhật'}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Lưu thay đổi
                        </button>
                        <button
                          onClick={handleCancel}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thông tin tài khoản */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Thông tin tài khoản</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID người dùng</label>
                    <div className="mt-1">
                      <span className="text-sm text-gray-900 font-mono">{user._id}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                    <div className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cập nhật lần cuối</label>
                    <div className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Thời gian hoạt động</label>
                    <div className="mt-1">
                      <span className="text-gray-900">
                        {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ngày
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thống kê hoạt động */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Thống kê hoạt động</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Trạng thái tài khoản</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Vai trò hệ thống</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Số ngày sử dụng</span>
                    <span className="text-gray-900 font-medium">
                      {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ngày
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Lần cập nhật cuối</span>
                    <span className="text-gray-900 font-medium">
                      {Math.floor((Date.now() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60))} giờ trước
                    </span>
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
