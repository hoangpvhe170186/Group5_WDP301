import React from 'react';

const OrderManagementScreen = () => {
  const orders = [
    { id: 'HE-84261', seller: 'Shop A', date: '2025-10-12', status: 'Đang vận chuyển', statusColor: 'blue' },
    { id: 'HE-84260', seller: 'Shop B', date: '2025-10-12', status: 'Đã giao hàng', statusColor: 'green' },
    { id: 'HE-84259', seller: 'Shop A', date: '2025-10-11', status: 'Chờ lấy hàng', statusColor: 'yellow' },
    { id: 'HE-84258', seller: 'Shop C', date: '2025-10-10', status: 'Đã hủy', statusColor: 'red' },
  ];

  const StatusBadge = ({ text, color }) => {
    const colors = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
    };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>{text}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã Đơn</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Người bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày đặt</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map(order => (
              <tr key={order.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.seller}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.date}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm"><StatusBadge text={order.status} color={order.statusColor} /></td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <a href="#" className="text-orange-600 hover:text-orange-900">Xem chi tiết</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagementScreen;