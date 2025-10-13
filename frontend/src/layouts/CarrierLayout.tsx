// src/layouts/CarrierLayout.tsx
"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/carrier-dashboard/dashboard/Sidebar";
import { DashboardHeader } from "@/components/carrier-dashboard/dashboard/Header";

export default function CarrierLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <DashboardSidebar
          currentView="overview"
          onViewChange={() => {}}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">{children}</main>
      </div>
    </div>
  );
}