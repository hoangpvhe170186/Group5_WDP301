"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, History, User, X } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { ViewType } from "../index";

interface DashboardSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: "overview" as ViewType, label: "Tổng quan", icon: LayoutDashboard },
  { id: "orders" as ViewType, label: "Đơn hàng", icon: Package },
  { id: "history" as ViewType, label: "Lịch sử", icon: History },
  { id: "profile" as ViewType, label: "Hồ sơ", icon: User },
];

export function DashboardSidebar({
  currentView,
  onViewChange,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const [user, setUser] = useState<{ full_name?: string; role?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await carrierApi.getProfile();
        setUser(data);
      } catch (e) {
        console.warn("⚠ Không thể tải profile carrier:", e);
      }
    })();
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 md:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    onViewChange(item.id);
                    onClose();
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {user?.fullName || "Đang tải..."}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user?.role || "Carrier"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
