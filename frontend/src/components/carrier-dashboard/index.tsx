"use client"
import { useState } from "react"

import { OrdersList } from "./dashboard/orders-list"
import { JobDetails } from "./dashboard/job-details"
import { ProfileManagement } from "./dashboard/profile-management"
import { JobHistory } from "./dashboard/job-history"
import { UploadGoods } from "./dashboard/upload-goods"
import { ReportIncident } from "./dashboard/report-incident"
import { DashboardOverview } from "./dashboard/Overview"
import { DashboardHeader } from "./dashboard/Header"
import { DashboardSidebar } from "./dashboard/Sidebar"

export type ViewType =
  | "overview"
  | "orders"
  | "job-details"
  | "profile"
  | "history"
  | "upload-before"
  | "upload-after"
  | "report-incident"

export function CarrierDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("overview")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleViewJob = (jobId: string) => {
    setSelectedJobId(jobId)
    setCurrentView("job-details")
  }

  const handleSelectJob = (jobId: string) => {
    handleViewJob(jobId)
  }

  const renderView = () => {
    switch (currentView) {
      case "overview":
        return (
          <DashboardOverview 
            onViewOrders={() => setCurrentView("orders")}
            onSelectJob={handleSelectJob}
          />
        )
      case "orders":
        return <OrdersList onViewJob={handleViewJob} />
      case "job-details":
        return (
          <JobDetails
            jobId={selectedJobId}
            onBack={() => setCurrentView("orders")}
            onUploadBefore={() => setCurrentView("upload-before")}
            onUploadAfter={() => setCurrentView("upload-after")}
            onReportIncident={() => setCurrentView("report-incident")}
          />
        )
      case "profile":
        return <ProfileManagement />
      case "history":
        return <JobHistory onViewJob={handleViewJob} />
      case "upload-before":
        return <UploadGoods type="before" jobId={selectedJobId} onBack={() => setCurrentView("job-details")} />
      case "upload-after":
        return <UploadGoods type="after" jobId={selectedJobId} onBack={() => setCurrentView("job-details")} />
      case "report-incident":
        return <ReportIncident jobId={selectedJobId} onBack={() => setCurrentView("job-details")} />
      default:
        return (
          <DashboardOverview 
            onViewOrders={() => setCurrentView("orders")}
            onSelectJob={handleSelectJob}
          />
        )
    }
  }

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
  )
}