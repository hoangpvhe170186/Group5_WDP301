import React from 'react';
import UserProfile from '../components/UserProfile';
import HomeHeader from '../components/HomeHeader';
import HomeFooter from '../components/HomeFooter';

const UserProfilePage: React.FC = () => {
  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <UserProfile />
      </main>
      <HomeFooter />
    </>
  );
};

export default UserProfilePage;
