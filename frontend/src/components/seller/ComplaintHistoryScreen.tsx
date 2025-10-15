import React from 'react';

const ComplaintHistoryScreen = () => {
  const history = [
    { id: 'KN-011', orderId: 'HE-84235', seller: 'Shop A', resolvedDate: '2025-10-10', resolution: 'Hoàn tiền 50% giá trị sản phẩm.' },
    { id: 'KN-010', orderId: 'HE-84233', seller: 'Shop B', resolvedDate: '2025-10-08', resolution: 'Tặng mã giảm giá 10% cho đơn hàng tiếp theo.' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Lịch sử Giao dịch</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã Khiếu nại</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Người bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày giải quyết</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phương án xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {history.map(item => (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.seller}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.resolvedDate}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.resolution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintHistoryScreen;