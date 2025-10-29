import React from 'react';
import OrderHistoryScreen from '@/components/OrderHistoryScreen';

const OrderHistoryPage: React.FC = () => {
  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <OrderHistoryScreen />
      </main>
    </>
  );
};

export default OrderHistoryPage;
