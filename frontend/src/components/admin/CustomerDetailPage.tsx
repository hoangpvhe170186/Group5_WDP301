// CustomerDetailPage.tsx (mockup)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/services/admin.service"; // Import adminApi

const CustomerDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const response = await adminApi.getUserDetail(userId);
        setUser(response.data);
      } catch (err) {
        setError("Không thể tải thông tin khách hàng.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [userId]);

  const handleStatusChange = async (status: string) => {
    try {
      await adminApi.updateUserStatus(userId, status); // Cập nhật trạng thái
      setUser({ ...user, status }); // Cập nhật ngay trên UI
    } catch (err) {
      setError("Không thể cập nhật trạng thái.");
      console.error(err);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Chi tiết khách hàng: {user?.fullname}</h1>
      <p>Email: {user?.email}</p>
      <p>Số điện thoại: {user?.phone}</p>
      <p>Trạng thái: {user?.status}</p>
      <select
        value={user?.status}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="Active">Hoạt động</option>
        <option value="Inactive">Không hoạt động</option>
        <option value="Banned">Bị khóa</option>
      </select>
      <button onClick={() => navigate("/admin/customers")}>Quay lại</button>
    </div>
  );
};

export default CustomerDetailPage;
