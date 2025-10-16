import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, Truck, UserCog } from "lucide-react";
import AssignModal from "./AssignModal";
const OrderManagementScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const handleOpenAssignModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsAssignOpen(true);
  };

  const StatusBadge = ({ text }) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-blue-100 text-blue-800',
      'In Transit': 'bg-indigo-100 text-indigo-800',
      Completed: 'bg-green-100 text-green-800',
      Canceled: 'bg-red-100 text-red-800',
    };
    const colorClass = colors[text] || 'bg-gray-100 text-gray-800';
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {text}
      </span>
    );
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/users/orders/');
        setOrders(res.data || []);
      } catch (err) {
        console.error('❌ Lỗi khi tải danh sách đơn hàng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Đang tải dữ liệu...</p>;
  }

  return (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn hàng</h1>

    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">
              Mã Đơn
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-32">
              Seller
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-32">
              Khách hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-60">
              Địa chỉ lấy hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-60">
              Địa chỉ giao hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-32">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 w-32">
              Hành động
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                Không có đơn hàng nào.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50 transition">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  #{order._id}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {order.seller_id?.full_name || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {order.customer_id?.full_name || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[14rem]">
                  {order.pickup_address}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[14rem]">
                  {order.delivery_address}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <StatusBadge text={order.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium flex justify-end gap-3">
                  {/* Xem chi tiết */}
                  <a
                    href={`/orders/${order._id}`}
                    className="text-orange-600 hover:text-orange-900"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-5 h-5 cursor-pointer" />
                  </a>

                  {order.status === "Pending" && (
  <button
    onClick={() => handleOpenAssignModal(order._id)}
    className="text-blue-600 hover:text-blue-900"
    title="Giao việc"
  >
    <Truck className="w-5 h-5 cursor-pointer" />
  </button>
)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* ✅ Modal giao việc đặt ngoài bảng */}
    {isAssignOpen && selectedOrderId && (
      <AssignModal
        orderId={selectedOrderId}
        onClose={() => setIsAssignOpen(false)}
      />
    )}
  </div>
);
};

export default OrderManagementScreen;
