import React from 'react';
import OrderHistoryScreen from '@/components/OrderHistoryScreen';
import HomeHeader from '../components/HomeHeader';
import HomeFooter from '../components/HomeFooter';

const OrderHistoryPage: React.FC = () => {
  return (
    <>
      <HomeHeader />
      <main className="min-h-screen bg-gray-50">
        <OrderHistoryScreen />
      </main>
      <HomeFooter />
    </>
  );
};

export default OrderHistoryPage;
