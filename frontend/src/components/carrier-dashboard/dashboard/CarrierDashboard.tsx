"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { DashboardOverview } from "./Overview";
import { OrdersList } from "./orders-list";
import { JobDetails } from "./job-details";
import { ProfileManagement } from "./profile-management";
import { JobHistory } from "./job-history";
import { UploadGoods } from "./upload-goods";
import { ReportIncident } from "./report-incident";
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

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Mỗi lần search hoặc location.key thay đổi => đọc lại query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const job = params.get("job");
    const view = params.get("view");

    console.log("🔄 URL changed:", location.search);

    if (job) {
      setSelectedJobId(job);
      localStorage.setItem("lastViewedJobId", job);
    }

    if (view === "job-details" && job) {
      console.log("➡️ Go to job details:", job);
      setCurrentView("job-details");
    } else if (view === "orders") {
      setCurrentView("orders");
    } else if (view === "overview" || (!job && !view)) {
      setCurrentView("overview");
    }
  }, [location.search, location.key]); // 👈 bắt cả key lẫn search

  // ✅ Khi rời khỏi chi tiết thì clear job
  useEffect(() => {
    if (
      ![
        "job-details",
        "upload-before",
        "upload-after",
        "report-incident",
      ].includes(currentView)
    ) {
      setSelectedJobId(null);
      localStorage.removeItem("lastViewedJobId");
    }
  }, [currentView]);

  // ✅ Hàm mở chi tiết đơn và sync URL
  const handleViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentView("job-details");
    localStorage.setItem("lastViewedJobId", jobId);
    navigate(`/carrier/home?job=${jobId}&view=job-details`, { replace: false });
  };

  // ✅ Hàm quay lại từ chi tiết
  const handleBack = () => {
    navigate("/carrier/home?view=orders");
  };

  // ✅ Render view tương ứng
  const renderView = () => {
    switch (currentView) {
      case "overview":
        return (
          <DashboardOverview
            onViewOrders={() => setCurrentView("orders")}
            onSelectJob={handleViewJob}
          />
        );
      case "orders":
        return <OrdersList onViewJob={handleViewJob} />;
      case "job-details":
        return (
          <JobDetails
            jobId={selectedJobId}
            onBack={handleBack}
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
            onSelectJob={handleViewJob}
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

        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
