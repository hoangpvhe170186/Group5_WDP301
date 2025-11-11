import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Star,
  User,
  XCircle,
} from "lucide-react";
import {
  adminApi,
  type FeedbackOverview,
  type FeedbackReview,
  type IncidentReport,
} from "@/services/admin.service";

const REVIEW_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "New", label: "Mới" },
  { value: "InProgress", label: "Đang xử lý" },
  { value: "Resolved", label: "Đã xử lý" },
];

const INCIDENT_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "Pending", label: "Đang mở" },
  { value: "Resolved", label: "Đã giải quyết" },
  { value: "Rejected", label: "Từ chối" },
];

const REVIEW_STATUS_LABELS: Record<string, string> = {
  New: "Mới",
  InProgress: "Đang xử lý",
  Resolved: "Đã xử lý",
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  Pending: "Đang mở",
  Resolved: "Đã giải quyết",
  Rejected: "Từ chối",
};

type TabKey = "reviews" | "incidents";

const PAGE_SIZE = 10;

export default function FeedbackManagement() {
  const [overview, setOverview] = useState<FeedbackOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<Record<TabKey, string>>({
    reviews: "all",
    incidents: "all",
  });
  const [pagination, setPagination] = useState<Record<TabKey, number>>({
    reviews: 1,
    incidents: 1,
  });
  const [datasets, setDatasets] = useState<Record<
    TabKey,
    { items: FeedbackReview[] | IncidentReport[]; total: number; totalPages: number }
  >>({
    reviews: { items: [], total: 0, totalPages: 1 },
    incidents: { items: [], total: 0, totalPages: 1 },
  });
  const [loadingStates, setLoadingStates] = useState<Record<TabKey, boolean>>({
    reviews: false,
    incidents: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [reviewUpdatingId, setReviewUpdatingId] = useState<string | null>(null);
  const [incidentModal, setIncidentModal] = useState<{
    open: boolean;
    incident: IncidentReport | null;
    status: string;
    resolution: string;
  }>({ open: false, incident: null, status: "Pending", resolution: "" });
  const [incidentSaving, setIncidentSaving] = useState(false);

  const currentPage = pagination[activeTab];
  const currentStatus = statusFilters[activeTab];
  const currentData = datasets[activeTab];
  const isLoading = loadingStates[activeTab];

  const fetchListForTab = async (
    tab: TabKey,
    page: number,
    status: string,
    searchValue: string
  ) => {
    try {
      setError(null);
      setLoadingStates((prev) => ({ ...prev, [tab]: true }));
      const data = await adminApi.getFeedbackList({
        type: tab,
        page,
        limit: PAGE_SIZE,
        status,
        search: searchValue || undefined,
      });

      setDatasets((prev) => ({
        ...prev,
        [tab]: {
          items: data.items as any,
          total: data.total,
          totalPages: data.totalPages,
        },
      }));
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu phản hồi");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [tab]: false }));
    }
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        const data = await adminApi.getFeedbackOverview();
        setOverview(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setOverviewLoading(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    fetchListForTab(activeTab, currentPage, currentStatus, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, currentStatus, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, [activeTab]: 1 }));
    setSearchTerm(searchInput.trim());
  };

  const handleStatusChange = (value: string) => {
    setStatusFilters((prev) => ({ ...prev, [activeTab]: value }));
    setPagination((prev) => ({ ...prev, [activeTab]: 1 }));
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || next > currentData.totalPages) return;
    setPagination((prev) => ({ ...prev, [activeTab]: next }));
  };

  const handleReviewStatusUpdate = async (
    review: FeedbackReview,
    nextStatus: "New" | "InProgress" | "Resolved"
  ) => {
    try {
      setReviewUpdatingId(review.id);
      await adminApi.updateFeedbackReview(review.id, { status: nextStatus });
      fetchListForTab("reviews", pagination.reviews, statusFilters.reviews, searchTerm);
      refreshOverview();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật trạng thái phản hồi");
    } finally {
      setReviewUpdatingId(null);
    }
  };

  const refreshOverview = async () => {
    try {
      const data = await adminApi.getFeedbackOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openIncidentModal = (incident: IncidentReport) => {
    setIncidentModal({
      open: true,
      incident,
      status: incident.status,
      resolution: incident.resolution || "",
    });
  };

  const handleIncidentSave = async () => {
    if (!incidentModal.incident) return;
    try {
      setIncidentSaving(true);
      await adminApi.updateIncidentStatus(incidentModal.incident.id, {
        status: incidentModal.status as any,
        resolution: incidentModal.resolution,
      });
      setIncidentModal({ open: false, incident: null, status: "Pending", resolution: "" });
      fetchListForTab("incidents", pagination.incidents, statusFilters.incidents, searchTerm);
      refreshOverview();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật sự cố");
    } finally {
      setIncidentSaving(false);
    }
  };

  const renderRating = (value: number) => {
    const rating = Number(value) || 0;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${index < Math.round(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
          />
        ))}
        <span className="text-sm font-medium text-gray-700 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderOverviewCards = () => {
    if (!overview) return null;

    const { feedbackSummary, incidentSummary } = overview;
    const cards = [
      {
        label: "Tổng phản hồi",
        value: feedbackSummary.total,
        icon: MessageSquare,
        accent: "bg-blue-100 text-blue-600",
      },
      {
        label: "Điểm TB",
        value: feedbackSummary.avgRating,
        icon: Star,
        accent: "bg-yellow-100 text-yellow-600",
      },
      {
        label: "Tích cực",
        value: feedbackSummary.positive,
        icon: CheckCircle2,
        accent: "bg-green-100 text-green-600",
      },
      {
        label: "Sự cố mở",
        value: incidentSummary.status?.Pending || 0,
        icon: AlertTriangle,
        accent: "bg-red-100 text-red-600",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.accent}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRecentPanels = () => {
    if (!overview) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Phản hồi mới</h3>
            <span className="text-xs text-gray-500">5 gần nhất</span>
          </div>
          <div className="space-y-4">
            {overview.recentFeedbacks.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.customer?.name || "Khách hàng"}</p>
                    <p className="text-xs text-gray-500">{item.orderCode || "Không rõ đơn"}</p>
                  </div>
                  <div>{renderRating(item.rating)}</div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.comment || "Không có nội dung"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sự cố mới</h3>
            <span className="text-xs text-gray-500">5 gần nhất</span>
          </div>
          <div className="space-y-4">
            {overview.recentIncidents.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.type || "Sự cố"}</p>
                    <p className="text-xs text-gray-500">{item.orderCode || "Không rõ đơn"}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIncidentStatusClass(item.status)}`}>
                    {INCIDENT_STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description || "Không có mô tả"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getReviewStatusClass = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700";
      case "InProgress":
        return "bg-yellow-100 text-yellow-700";
      case "Resolved":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getIncidentStatusClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Resolved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderReviewsTable = () => {
    const items = currentData.items as FeedbackReview[];
    if (!items.length && !isLoading) {
      return <p className="text-sm text-gray-500">Chưa có phản hồi nào.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Khách hàng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Đơn hàng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Đánh giá</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Nội dung</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                      {review.customer?.name?.charAt(0) || <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.customer?.name || "Khách hàng"}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" /> {review.customer?.email || "Không rõ"}
                      </p>
                      {review.customer?.phone && (
                        <p className="text-xs text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" /> {review.customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{review.orderCode || "Không rõ"}</p>
                  <p className="text-xs text-gray-500">{review.category}</p>
                  <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleString("vi-VN")}</p>
                </td>
                <td className="px-4 py-4">{renderRating(review.rating)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <p className="line-clamp-3">{review.comment || "Không có nội dung"}</p>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReviewStatusClass(review.status)}`}>
                      {REVIEW_STATUS_LABELS[review.status] || review.status}
                    </span>
                    <select
                      value={review.status}
                      onChange={(e) =>
                        handleReviewStatusUpdate(
                          review,
                          e.target.value as "New" | "InProgress" | "Resolved"
                        )
                      }
                      disabled={reviewUpdatingId === review.id}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500"
                    >
                      {REVIEW_STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderIncidentsTable = () => {
    const items = currentData.items as IncidentReport[];
    if (!items.length && !isLoading) {
      return <p className="text-sm text-gray-500">Chưa có sự cố nào.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Người báo cáo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Đơn hàng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Loại sự cố</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Mô tả</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((incident) => (
              <tr key={incident.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm">
                  <div className="font-semibold text-gray-900">{incident.reporter?.name || "Khách"}</div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Mail className="w-3 h-3 mr-1" /> {incident.reporter?.email || "Không rõ"}
                  </p>
                  {incident.reporter?.phone && (
                    <p className="text-xs text-gray-500 flex items-center">
                      <Phone className="w-3 h-3 mr-1" /> {incident.reporter.phone}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{incident.orderCode || "Không rõ"}</p>
                  <p className="text-xs text-gray-400">{new Date(incident.createdAt).toLocaleString("vi-VN")}</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{incident.type}</p>
                  <p className="text-xs text-gray-500">{incident.resolution ? "Đã có phương án" : "Chưa xử lý"}</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <p className="line-clamp-3">{incident.description || "Không có mô tả"}</p>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIncidentStatusClass(incident.status)}`}>
                      {INCIDENT_STATUS_LABELS[incident.status] || incident.status}
                    </span>
                    <button
                      onClick={() => openIncidentModal(incident)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cập nhật
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý phản hồi</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi đánh giá khách hàng và sự cố vận hành.</p>
        </div>
        <button
          onClick={() => {
            refreshOverview();
            fetchListForTab(activeTab, currentPage, currentStatus, searchTerm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {overviewLoading && !overview ? (
        <div className="text-sm text-gray-500">Đang tải thống kê...</div>
      ) : (
        <>
          {renderOverviewCards()}
          {renderRecentPanels()}
        </>
      )}

      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-wrap items-center gap-4 border-b pb-4 mb-4">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "reviews"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Đánh giá khách hàng
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "incidents"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Báo cáo sự cố
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm theo khách hàng, đơn hàng, mô tả..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            >
              {(activeTab === "reviews" ? REVIEW_STATUS_OPTIONS : INCIDENT_STATUS_OPTIONS).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : activeTab === "reviews" ? (
          renderReviewsTable()
        ) : (
          renderIncidentsTable()
        )}

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
          <p>
            {currentData.total === 0
              ? "Không có bản ghi phù hợp"
              : `Hiển thị ${
                  (currentPage - 1) * PAGE_SIZE + 1
                }-${Math.min(currentPage * PAGE_SIZE, currentData.total)} / ${currentData.total} bản ghi`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            <span>
              Trang {currentPage} / {currentData.totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === currentData.totalPages || currentData.totalPages === 0}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {incidentModal.open && incidentModal.incident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Cập nhật sự cố</h3>
              <p className="text-sm text-gray-500">{incidentModal.incident.orderCode}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Trạng thái</label>
                <select
                  value={incidentModal.status}
                  onChange={(e) => setIncidentModal((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {INCIDENT_STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Phương án xử lý</label>
                <textarea
                  value={incidentModal.resolution}
                  onChange={(e) => setIncidentModal((prev) => ({ ...prev, resolution: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Nhập ghi chú xử lý..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIncidentModal({ open: false, incident: null, status: "Pending", resolution: "" })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleIncidentSave}
                disabled={incidentSaving}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60"
              >
                {incidentSaving ? "Đang lưu..." : "Lưu lại"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
