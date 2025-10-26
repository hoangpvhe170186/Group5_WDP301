import React, { useState } from 'react';
import Navbar from '../components/seller/Navbar';
import OrderManagementScreen from '../components/seller/OrderManagementScreen';
import ComplaintManagementScreen from '../components/seller/ComplaintManagementScreen';
import ComplaintHistoryScreen from '../components/seller/ComplaintHistoryScreen';
import OrderHistoryManagementScreen from '../components/seller/OrderHistoryManagementScreen';
export default function SellerPage() {
  const [currentPage, setPage] = useState('orders');

  const renderPage = () => {
    switch (currentPage) {
      case 'orders':
        return <OrderManagementScreen />;
      case 'complaints':
        return <ComplaintManagementScreen />;
      case 'history':
        return <OrderHistoryManagementScreen />;
      default:
        return <OrderManagementScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar currentPage={currentPage} setPage={setPage} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
    </div>
  );
}