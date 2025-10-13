"use client";
import { useState, useEffect } from "react";

import { OrdersList } from "./orders-list";
import { JobDetails } from "./job-details";
import { ProfileManagement } from "./profile-management";
import { JobHistory } from "./job-history";
import { UploadGoods } from "./upload-goods";
import { ReportIncident } from "./report-incident";
import { DashboardOverview } from "./Overview";
import { DashboardHeader } from "./Header";
import { DashboardSidebar } from "./Sidebar";

export type ViewType =
  | "overview"
  | "orders"
  | "job-details"
  | "profile"
  | "history"
  | "upload-before"
  | "upload-after"
  | "report-incident";

export function CarrierDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reset selectedJobId khi chuyển view
  useEffect(() => {
    if (currentView !== "job-details" && currentView !== "upload-before" && currentView !== "upload-after" && currentView !== "report-incident") {
      setSelectedJobId(null);
    }
  }, [currentView]);

  const handleViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentView("job-details");
  };

  const handleSelectJob = (jobId: string) => {
    handleViewJob(jobId);
  };

  const renderView = () => {
    switch (currentView) {
      case "overview":
        return (
          <DashboardOverview
            onViewOrders={() => setCurrentView("orders")}
            onSelectJob={handleSelectJob}
          />
        );
      case "orders":
        return <OrdersList onViewJob={handleViewJob} />;
      case "job-details":
        return (
          <JobDetails
            jobId={selectedJobId}
            onBack={() => setCurrentView("orders")}
            onUploadBefore={() => setCurrentView("upload-before")}
            onUploadAfter={() => setCurrentView("upload-after")}
            onReportIncident={() => setCurrentView("report-incident")}
          />
        );
      case "profile":
        return <ProfileManagement />;
      case "history":
        return <JobHistory onViewJob={handleViewJob} />;
      case "upload-before":
        return (
          <UploadGoods
            type="before"
            jobId={selectedJobId}
            onBack={() => setCurrentView("job-details")}
          />
        );
      case "upload-after":
        return (
          <UploadGoods
            type="after"
            jobId={selectedJobId}
            onBack={() => setCurrentView("job-details")}
          />
        );
      case "report-incident":
        return (
          <ReportIncident
            jobId={selectedJobId}
            onBack={() => setCurrentView("job-details")}
          />
        );
      default:
        return (
          <DashboardOverview
            onViewOrders={() => setCurrentView("orders")}
            onSelectJob={handleSelectJob}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <DashboardSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">{renderView()}</main>
      </div>
    </div>
  );
}