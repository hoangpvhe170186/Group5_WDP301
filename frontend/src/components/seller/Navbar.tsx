import React from 'react';
import { PackageIcon, AlertOctagonIcon, HistoryIcon, SettingsIcon } from './Icons';
import SupportInbox from "./SupportInbox";
import SellerNotifications from "./SellerNotifications";
import { LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Navbar = ({ currentPage, setPage }) => {
    const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    sessionStorage.removeItem("auth_token");

    window.location.href = "/auth/login";
  };
  const navItems = [
    { id: 'orders', label: 'Quản lý Đơn hàng', icon: <PackageIcon /> },
    { id: 'complaints', label: 'Quản lý Khiếu nại', icon: <AlertOctagonIcon /> },
    { id: 'history', label: 'Lịch sử Giao dịch', icon: <HistoryIcon /> },
  ];

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-orange-500" fill="currentColor"><path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" /></svg>
          <span className="text-xl font-bold text-gray-800">Seller Dashboard</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => { e.preventDefault(); setPage(item.id); }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${currentPage === item.id ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <SellerNotifications />
        <button className="text-gray-500 transition-colors hover:text-gray-800"><SettingsIcon /></button>
        <div className="h-9 w-9 cursor-pointer rounded-full bg-gray-200">
          <img src="https://placehold.co/100x100/orange/white?text=S" alt="Seller Avatar" className="h-full w-full rounded-full object-cover" />
        </div>
        <SupportInbox />
         <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive hover:text-white transition"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" /> Đăng xuất
          </Button>
      </div>
    </nav>
  );
};

export default Navbar;