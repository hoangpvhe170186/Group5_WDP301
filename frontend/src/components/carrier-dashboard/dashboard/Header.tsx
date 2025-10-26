"use client";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const handleLogout = () => {
    // Xóa token đăng nhập
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    sessionStorage.removeItem("auth_token");

    // Điều hướng về trang đăng nhập
    window.location.href = "/auth/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo + Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-primary-foreground"
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                HOME EXPRESS
              </h1>
              <p className="text-xs text-muted-foreground">
                Logistics Platform
              </p>
            </div>
          </div>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-2">
         
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive hover:text-white transition"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" /> Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
