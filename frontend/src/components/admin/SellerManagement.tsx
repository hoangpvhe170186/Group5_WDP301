import { useState, useEffect, useMemo } from "react";
import { adminApi, type User as UserType, getAuthToken } from "@/services/admin.service";
import api from "@/lib/axios";
import {
	TrendingUp,
	Users,
	Package,
	Search,
	Eye,
	Calendar,
	Trophy,
	BarChart3,
	ChevronDown,
	ChevronUp,
	ArrowUpDown,
	Ban,
	User,
	CheckCircle,
	AlertCircle,
	Phone,
	Mail,
} from "lucide-react";
import React from "react";
import SellerDetail from "./SellerDetail";
// @ts-ignore - recharts types may not be available but package is installed
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ====== Configs ======
const ITEMS_PER_PAGE = 5;
const BASE_SALARY_VND = 5_000_000; // 5 triệu VND
const KPI_MIN_ORDERS = 10; // KPI: 10 đơn/tháng
const COMMISSION_RATE = 0.02; // 2%
const KPI_EARLY_DEADLINE_DAY = 20; // Hoàn thành KPI trước ngày 20 được điểm thưởng
const POINT_VALUE_VND = 100_000; // 1 điểm = 100k VND
const POINTS_PER_EXTRA_ORDER = 1; // Mỗi đơn vượt KPI = 1 điểm
const EARLY_KPI_BONUS_POINTS = 5; // Hoàn thành KPI sớm được 5 điểm

// ====== Types used locally ======
type SellerStats = {
	user: UserType;
	completedOrders: number;
	inProgressOrders: number; // số đơn đang thực hiện
	totalCompletedValue: number; // tổng giá trị đơn Completed
	commission: number; // P3: 2% of totalCompletedValue
	baseAdjusted: number; // P1: lương cơ bản sau KPI
	bonusPoints: number; // P2: điểm thưởng
	bonusSalary: number; // P2: lương từ điểm thưởng
	totalPayout: number; // P1 + P2 + P3
	rank?: number; // xếp hạng
};

type OrderLite = {
	id: string;
	code: string;
	status: string;
	price: number;
	createdAt: string;
	completedAt?: string | null; // thời gian hoàn thành từ OrderTracking
	pickupAddress: string;
	deliveryAddress: string;
	sellerId?: string | null;
};

type OrderTrackingLite = {
	order_id: string;
	status: string;
	createdAt: string;
};

// ====== Helpers ======
function formatCurrencyVND(n: number) {
	try {
		return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
	} catch {
		return `${Math.round(n)} VND`;
	}
}

function isSameMonth(dateStr: string, year: number, monthIndex: number) {
	if (!dateStr) return false;
	const d = new Date(dateStr);
	return d.getFullYear() === year && d.getMonth() === monthIndex;
}

function calcPayout3P(
	completedOrders: number,
	totalCompletedValue: number,
	completedDates: string[]
) {
	// P3: Commission 2% giá trị đơn
	const commission = totalCompletedValue * COMMISSION_RATE;

	// P1: Lương cứng với KPI
	const baseAdjusted =
		completedOrders >= KPI_MIN_ORDERS
			? BASE_SALARY_VND
			: Math.floor(BASE_SALARY_VND * (completedOrders / KPI_MIN_ORDERS)); // giảm lương tỷ lệ theo KPI

	// P2: Tính điểm thưởng
	let bonusPoints = 0;
	
	// Kiểm tra hoàn thành KPI sớm (trước ngày 20)
	if (completedOrders >= KPI_MIN_ORDERS) {
		// Tìm đơn thứ 10 (KPI) xem hoàn thành khi nào
		const sortedDates = completedDates
			.filter(Boolean)
			.map((d) => new Date(d))
			.sort((a, b) => a.getTime() - b.getTime());
		
		if (sortedDates.length >= KPI_MIN_ORDERS) {
			const kpiCompletionDate = sortedDates[KPI_MIN_ORDERS - 1];
			if (kpiCompletionDate.getDate() <= KPI_EARLY_DEADLINE_DAY) {
				bonusPoints += EARLY_KPI_BONUS_POINTS;
			}
		}
		
		// Điểm vượt KPI: mỗi đơn vượt = 1 điểm
		if (completedOrders > KPI_MIN_ORDERS) {
			bonusPoints += (completedOrders - KPI_MIN_ORDERS) * POINTS_PER_EXTRA_ORDER;
		}
	}
	
	const bonusSalary = bonusPoints * POINT_VALUE_VND;
	const totalPayout = baseAdjusted + commission + bonusSalary;
	
	return { commission, baseAdjusted, bonusPoints, bonusSalary, totalPayout };
}

type SortField = "fullName" | "completedOrders" | "totalPayout" | "createdAt";
type SortOrder = "asc" | "desc";

export default function SellerManagement() {
	// ===== UI state =====
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [filterStatus, setFilterStatus] = useState<"all" | "Active" | "Inactive" | "Banned">("all");
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [sortField, setSortField] = useState<SortField>("fullName");
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
	const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
	const [showSellerDetail, setShowSellerDetail] = useState(false);
	const [showBanModal, setShowBanModal] = useState(false);
	const [banReason, setBanReason] = useState("");
	const [sellerToBan, setSellerToBan] = useState<string | null>(null);

	// period selection (default: current month)
	const now = new Date();
	const [selectedYear, setSelectedYear] = useState(now.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11

	// data
	const [sellers, setSellers] = useState<UserType[]>([]);
	const [totalSellers, setTotalSellers] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [orders, setOrders] = useState<OrderLite[]>([]);

	// derived
	const [statsBySeller, setStatsBySeller] = useState<Record<string, SellerStats>>({});

	// modal
	const [showFormulaModal, setShowFormulaModal] = useState(false);

	// ===== Fetch data =====
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// 1) Sellers (paginated)
				const page = currentPage;
				const limit = ITEMS_PER_PAGE;
				const sellerRes = await adminApi.getUsersByRole("sellers", page, limit);
				setSellers(sellerRes.users);
				setTotalSellers(sellerRes.total);
				setTotalPages(sellerRes.totalPages || Math.ceil(sellerRes.total / limit));

				// 2) All orders (admin can use /users/orders which returns full list)
				const { data: allOrdersData } = await api.get("/users/orders", {
					headers: { Authorization: `Bearer ${getAuthToken()}` },
				});

				const normalized: OrderLite[] = (allOrdersData || []).map((o: any) => ({
					id: String(o._id),
					code: o.orderCode || "",
					status: o.status || "",
					price: Number(o.total_price || 0),
					createdAt: o.createdAt || "",
					completedAt: null, // sẽ được cập nhật từ tracking
					pickupAddress: o.pickup_address || "",
					deliveryAddress: o.delivery_address || "",
					sellerId: o.seller_id ? String(o.seller_id._id || o.seller_id) : null,
				}));
				setOrders(normalized);

				// 3) Fetch tracking data cho các đơn để lấy thời gian COMPLETED
				const trackingMap: Record<string, OrderTrackingLite[]> = {};
				const token = getAuthToken();
				
				// Lấy tracking cho từng đơn (có thể tối ưu bằng batch API nếu có)
				for (const order of normalized) {
					try {
						const { data: trackingData } = await api.get(`/order-tracking/${order.id}`, {
							headers: { Authorization: `Bearer ${token}` },
						});
						const trackings: OrderTrackingLite[] = (trackingData.trackings || []).map((t: any) => ({
							order_id: String(t.order_id || order.id),
							status: t.status || "",
							createdAt: t.createdAt || "",
						}));
						trackingMap[order.id] = trackings;
						
						// Tìm tracking COMPLETED đầu tiên (mới nhất)
						const completedTracking = trackings.find((t) => t.status === "COMPLETED");
						if (completedTracking) {
							const orderIndex = normalized.findIndex((o) => o.id === order.id);
							if (orderIndex >= 0) {
								normalized[orderIndex].completedAt = completedTracking.createdAt;
							}
						}
					} catch (err) {
						console.warn(`Failed to fetch tracking for order ${order.id}:`, err);
					}
				}
				
				setOrders(normalized);
			} catch (e: any) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, selectedYear, selectedMonth]);

	// ===== Build stats for current page sellers and selected month =====
	useEffect(() => {
		if (!sellers.length) return;
		const byId: Record<string, SellerStats> = {};
		for (const s of sellers) {
			// Lọc đơn theo seller
			const sellerOrders = orders.filter((o) => o.sellerId === s.id);
			
			// Đếm đơn đang thực hiện (không phải COMPLETED, CANCELLED, DECLINED)
			const inProgress = sellerOrders.filter(
				(o) => !["COMPLETED", "CANCELLED", "DECLINED"].includes(o.status)
			);
			
			// Lọc đơn COMPLETED dựa trên thời gian hoàn thành (completedAt), không phải createdAt
			const completed = sellerOrders.filter((o) => {
				if (o.status !== "COMPLETED") return false;
				// Nếu có completedAt, dùng nó; nếu không, fallback về createdAt
				const completionDate = o.completedAt || o.createdAt;
				return isSameMonth(completionDate, selectedYear, selectedMonth);
			});
			
			// Lấy danh sách ngày hoàn thành để tính P2
			const completedDates = completed
				.map((o) => o.completedAt || o.createdAt)
				.filter(Boolean);
			
			const totalValue = completed.reduce((sum, o) => sum + (o.price || 0), 0);
			const { commission, baseAdjusted, bonusPoints, bonusSalary, totalPayout } = calcPayout3P(
				completed.length,
				totalValue,
				completedDates
			);
			
			byId[s.id] = {
				user: s,
				completedOrders: completed.length,
				inProgressOrders: inProgress.length,
				totalCompletedValue: totalValue,
				commission,
				baseAdjusted,
				bonusPoints,
				bonusSalary,
				totalPayout,
			};
		}
		
		// Xếp hạng theo totalPayout
		const sortedSellers = Object.values(byId).sort((a, b) => b.totalPayout - a.totalPayout);
		sortedSellers.forEach((stat, index) => {
			byId[stat.user.id].rank = index + 1;
		});
		
		setStatsBySeller(byId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sellers, orders, selectedYear, selectedMonth]);

	// ===== Dashboard aggregates =====
	const dashboard = useMemo(() => {
		const pageSellers = sellers.map((s) => statsBySeller[s.id]).filter(Boolean);
		const totalCompletedOrders = pageSellers.reduce((sum, it) => sum + it.completedOrders, 0);
		const totalPayout = pageSellers.reduce((sum, it) => sum + it.totalPayout, 0);
		return { totalCompletedOrders, totalPayout };
	}, [sellers, statsBySeller]);

	// ===== Handlers =====
	const handleViewSeller = (sellerId: string) => {
		setSelectedSellerId(sellerId);
		setShowSellerDetail(true);
	};

	const handleBanSeller = (sellerId: string) => {
		setSellerToBan(sellerId);
		setShowBanModal(true);
	};

	const confirmBanSeller = async () => {
		if (!sellerToBan || !banReason.trim()) return;

		try {
			await adminApi.updateUser(sellerToBan, {
				status: "Banned",
				banReason: banReason.trim()
			});
			
			setSellers(sellers.map(seller => 
				seller.id === sellerToBan 
					? { ...seller, status: "Banned", banReason: banReason.trim() }
					: seller
			));
			
			setShowBanModal(false);
			setBanReason("");
			setSellerToBan(null);
		} catch (err: any) {
			console.error("Lỗi khi khóa seller:", err);
		}
	};

	const handleUnbanSeller = async (sellerId: string) => {
		try {
			await adminApi.updateUser(sellerId, {
				status: "Active",
				banReason: ""
			});
			
			setSellers(sellers.map(seller => 
				seller.id === sellerId 
					? { ...seller, status: "Active", banReason: "" }
					: seller
			));
		} catch (err: any) {
			console.error("Lỗi khi mở khóa seller:", err);
		}
	};

	const handleBackFromDetail = () => {
		setShowSellerDetail(false);
		setSelectedSellerId(null);
	};

	const toggleExpandRow = (sellerId: string) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(sellerId)) {
			newExpanded.delete(sellerId);
		} else {
			newExpanded.add(sellerId);
		}
		setExpandedRows(newExpanded);
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Active":
				return "bg-green-100 text-green-800";
			case "Inactive":
				return "bg-gray-100 text-gray-800";
			case "Banned":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "Active":
				return "Hoạt động";
			case "Inactive":
				return "Không hoạt động";
			case "Banned":
				return "Bị khóa";
			default:
				return "Không xác định";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "Active":
				return <CheckCircle className="w-4 h-4" />;
			case "Inactive":
				return <AlertCircle className="w-4 h-4" />;
			case "Banned":
				return <Ban className="w-4 h-4" />;
			default:
				return <AlertCircle className="w-4 h-4" />;
		}
	};

	// Filter and sort
	const filteredAndSortedSellers = sellers
		.filter((seller) => {
			const matchesSearch =
				seller.fullName.toLowerCase().includes(search.toLowerCase()) ||
				seller.email.toLowerCase().includes(search.toLowerCase()) ||
				seller.id.toLowerCase().includes(search.toLowerCase()) ||
				(seller.phone || "").includes(search);

			const matchesStatus = filterStatus === "all" || seller.status === filterStatus;

			return matchesSearch && matchesStatus;
		})
		.sort((a, b) => {
			const stA = statsBySeller[a.id];
			const stB = statsBySeller[b.id];
			let aValue: any;
			let bValue: any;

			switch (sortField) {
				case "fullName":
					aValue = a.fullName;
					bValue = b.fullName;
					break;
				case "completedOrders":
					aValue = stA?.completedOrders ?? 0;
					bValue = stB?.completedOrders ?? 0;
					break;
				case "totalPayout":
					aValue = stA?.totalPayout ?? 0;
					bValue = stB?.totalPayout ?? 0;
					break;
				case "createdAt":
					aValue = new Date(a.createdAt).getTime();
					bValue = new Date(b.createdAt).getTime();
					break;
				default:
					aValue = a.fullName;
					bValue = b.fullName;
			}

			if (sortOrder === "asc") {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

	// Nếu đang hiển thị chi tiết seller
	if (showSellerDetail) {
		return <SellerDetail sellerId={selectedSellerId || undefined} onBack={handleBackFromDetail} />;
	}

	return (
		<div className="space-y-6">
			{/* Ban Modal */}
			{showBanModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-96">
						<h3 className="text-lg font-semibold mb-4">Khóa Seller</h3>
						<p className="text-gray-600 mb-4">Vui lòng nhập lý do khóa seller:</p>
						<textarea
							value={banReason}
							onChange={(e) => setBanReason(e.target.value)}
							placeholder="Nhập lý do khóa..."
							className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						/>
						<div className="flex gap-3 mt-4">
							<button
								onClick={confirmBanSeller}
								disabled={!banReason.trim()}
								className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
							>
								Xác nhận khóa
							</button>
							<button
								onClick={() => {
									setShowBanModal(false);
									setBanReason("");
									setSellerToBan(null);
								}}
								className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
					Quản lý Seller
					<button
						onClick={() => setShowFormulaModal(true)}
						className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-gray-600 hover:bg-gray-100 text-xs"
						title="Xem công thức tính lương"
					>
						?
					</button>
				</h1>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 border rounded px-2 py-1">
						<Calendar className="w-4 h-4 text-gray-500" />
						<select
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(Number(e.target.value))}
							className="bg-transparent outline-none text-sm"
						>
							{Array.from({ length: 12 }).map((_, i) => (
								<option key={i} value={i}>
									Tháng {i + 1}
								</option>
							))}
						</select>
					</div>
					<select
						value={selectedYear}
						onChange={(e) => setSelectedYear(Number(e.target.value))}
						className="border rounded px-2 py-1 text-sm"
					>
						{[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600">Tổng seller</p>
							<p className="text-2xl font-bold text-gray-900">{totalSellers}</p>
						</div>
						<Users className="w-8 h-8 text-orange-500 opacity-20" />
					</div>
				</div>
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600">Đang hoạt động</p>
							<p className="text-2xl font-bold text-green-600">
								{sellers.filter((s) => s.status === "Active").length}
							</p>
						</div>
						<CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
					</div>
				</div>
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600">Đơn hoàn thành (tháng)</p>
							<p className="text-2xl font-bold text-indigo-600">
								{dashboard.totalCompletedOrders}
							</p>
						</div>
						<Package className="w-8 h-8 text-indigo-500 opacity-20" />
					</div>
				</div>
				<div className="bg-white rounded-lg shadow p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600">Tổng payout</p>
							<p className="text-2xl font-bold text-blue-600">
								{formatCurrencyVND(dashboard.totalPayout)}
							</p>
						</div>
						<TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
					</div>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Chart: Payout by Seller */}
				<div className="border rounded p-4">
					<div className="flex items-center gap-2 mb-4">
						<BarChart3 className="w-5 h-5 text-blue-600" />
						<h3 className="font-semibold">Payout theo Seller</h3>
					</div>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart
							data={Object.values(statsBySeller)
								.sort((a, b) => b.totalPayout - a.totalPayout)
								.slice(0, 10)
								.map((s) => ({
									name: s.user.fullName.length > 15 ? s.user.fullName.substring(0, 15) + "..." : s.user.fullName,
									payout: s.totalPayout,
									p1: s.baseAdjusted,
									p2: s.bonusSalary,
									p3: s.commission,
								}))}
						>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
							<YAxis />
							<Tooltip formatter={(value: number) => formatCurrencyVND(value)} />
							<Legend />
							<Bar dataKey="p1" stackId="a" fill="#3b82f6" name="P1: Lương cứng" />
							<Bar dataKey="p2" stackId="a" fill="#f59e0b" name="P2: Thưởng" />
							<Bar dataKey="p3" stackId="a" fill="#10b981" name="P3: Commission" />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Chart: Orders Completed */}
				<div className="border rounded p-4">
					<div className="flex items-center gap-2 mb-4">
						<Package className="w-5 h-5 text-green-600" />
						<h3 className="font-semibold">Đơn Completed theo Seller</h3>
					</div>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart
							data={Object.values(statsBySeller)
								.sort((a, b) => b.completedOrders - a.completedOrders)
								.slice(0, 10)
								.map((s) => ({
									name: s.user.fullName.length > 15 ? s.user.fullName.substring(0, 15) + "..." : s.user.fullName,
									completed: s.completedOrders,
									kpi: KPI_MIN_ORDERS,
								}))}
						>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey="completed" fill="#10b981" name="Đơn Completed" />
							<Bar dataKey="kpi" fill="#ef4444" name="KPI (10 đơn)" />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								type="text"
								placeholder="Tìm kiếm theo tên, email, SĐT, ID..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							/>
						</div>
					</div>
					<div className="flex gap-4">
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value as any)}
							className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						>
							<option value="all">Tất cả trạng thái</option>
							<option value="Active">Hoạt động</option>
							<option value="Inactive">Không hoạt động</option>
							<option value="Banned">Bị khóa</option>
						</select>
					</div>
				</div>
			</div>

			{/* Sellers Table */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
									onClick={() => handleSort("fullName")}
								>
									<div className="flex items-center gap-2">
										Thông tin seller
										<ArrowUpDown className="w-4 h-4" />
									</div>
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
									onClick={() => handleSort("completedOrders")}
								>
									<div className="flex items-center gap-2">
										Đơn hàng
										<ArrowUpDown className="w-4 h-4" />
									</div>
								</th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
									onClick={() => handleSort("totalPayout")}
								>
									<div className="flex items-center gap-2">
										Payout
										<ArrowUpDown className="w-4 h-4" />
									</div>
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td colSpan={7} className="px-6 py-8 text-center text-gray-500">
										Đang tải...
									</td>
								</tr>
							) : filteredAndSortedSellers.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-6 py-8 text-center text-gray-500">
										Không có seller nào
									</td>
								</tr>
							) : (
								filteredAndSortedSellers.map((seller) => {
									const st = statsBySeller[seller.id];
									return (
										<React.Fragment key={seller.id}>
											<tr className="hover:bg-gray-50">
												<td className="px-6 py-4 whitespace-nowrap">
													<button onClick={() => toggleExpandRow(seller.id)} className="p-1 hover:bg-gray-200 rounded">
														{expandedRows.has(seller.id) ? (
															<ChevronUp className="w-4 h-4" />
														) : (
															<ChevronDown className="w-4 h-4" />
														)}
													</button>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
															{seller.avatar ? (
																<img src={seller.avatar} alt={seller.fullName} className="h-10 w-10 rounded-full" />
															) : (
																<User className="w-5 h-5 text-orange-600" />
															)}
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900">{seller.fullName || "(Không tên)"}</div>
															<div className="text-sm text-gray-500">ID: {seller.id}</div>
															{st?.rank && (
																<div className="text-xs text-gray-500 flex items-center gap-1">
																	{st.rank <= 3 && (
																		<Trophy className={`w-3 h-3 ${
																			st.rank === 1 ? "text-yellow-500" :
																			st.rank === 2 ? "text-gray-400" :
																			"text-orange-600"
																		}`} />
																	)}
																	Hạng {st.rank}
																</div>
															)}
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div>
														<div className="flex items-center text-sm text-gray-900">
															<Mail className="w-4 h-4 mr-2 text-gray-400" />
															{seller.email}
														</div>
														<div className="flex items-center text-sm text-gray-500">
															<Phone className="w-4 h-4 mr-2 text-gray-400" />
															{seller.phone || "—"}
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm text-gray-900">
														{st?.completedOrders ?? 0} hoàn thành
													</div>
													<div className="text-xs text-gray-500">
														{st?.inProgressOrders ?? 0} đang thực hiện
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-medium text-gray-900">
														{formatCurrencyVND(st?.totalPayout ?? 0)}
													</div>
													<div className="text-xs text-gray-500">
														P1: {formatCurrencyVND(st?.baseAdjusted ?? 0)} • P2: {st?.bonusPoints ?? 0}đ • P3: {formatCurrencyVND(st?.commission ?? 0)}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span
														className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
															seller.status
														)}`}
													>
														{getStatusIcon(seller.status)}
														<span className="ml-1">{getStatusText(seller.status)}</span>
													</span>
													{seller.banReason && (
														<div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={seller.banReason}>
															{seller.banReason}
														</div>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div className="flex space-x-2">
														<button
															onClick={() => handleViewSeller(seller.id)}
															className="text-blue-600 hover:text-blue-900 p-1"
															title="Xem chi tiết"
														>
															<Eye className="w-4 h-4" />
														</button>
														
														{seller.status === "Banned" ? (
															<button
																onClick={() => handleUnbanSeller(seller.id)}
																className="text-green-600 hover:text-green-900 p-1"
																title="Mở khóa"
															>
																<CheckCircle className="w-4 h-4" />
															</button>
														) : (
															<button
																onClick={() => handleBanSeller(seller.id)}
																className="text-red-600 hover:text-red-900 p-1"
																title="Khóa tài khoản"
															>
																<Ban className="w-4 h-4" />
															</button>
														)}
													</div>
												</td>
											</tr>
											{expandedRows.has(seller.id) && (
												<tr className="bg-gray-50">
													<td colSpan={8} className="px-6 py-4">
														<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
															{/* Thống kê */}
															<div>
																<h4 className="font-semibold text-gray-900 mb-3">Thống kê</h4>
																<div className="space-y-2 text-sm">
																	<div className="flex justify-between">
																		<span className="text-gray-600">Đơn hoàn thành:</span>
																		<span className="font-medium text-gray-900">{st?.completedOrders ?? 0}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">Đơn đang thực hiện:</span>
																		<span className="font-medium text-gray-900">{st?.inProgressOrders ?? 0}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">Giá trị đơn:</span>
																		<span className="font-medium text-gray-900">{formatCurrencyVND(st?.totalCompletedValue ?? 0)}</span>
																	</div>
																</div>
															</div>

															{/* Tài chính */}
															<div>
																<h4 className="font-semibold text-gray-900 mb-3">Tài chính</h4>
																<div className="space-y-2 text-sm">
																	<div className="flex justify-between">
																		<span className="text-gray-600">P1 - Lương cứng:</span>
																		<span className="font-medium text-gray-900">{formatCurrencyVND(st?.baseAdjusted ?? 0)}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">P2 - Thưởng:</span>
																		<span className="font-medium text-gray-900">{st?.bonusPoints ?? 0} điểm = {formatCurrencyVND(st?.bonusSalary ?? 0)}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">P3 - Commission:</span>
																		<span className="font-medium text-gray-900">{formatCurrencyVND(st?.commission ?? 0)}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-900 font-semibold">Tổng Payout:</span>
																		<span className="font-bold text-blue-600">{formatCurrencyVND(st?.totalPayout ?? 0)}</span>
																	</div>
																</div>
															</div>
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
					<div className="text-sm text-gray-700">
						Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalSellers)} của{" "}
						{totalSellers} seller
					</div>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Trước
						</button>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								onClick={() => setCurrentPage(page)}
								className={`px-3 py-1 rounded-lg ${
									currentPage === page ? "bg-orange-500 text-white" : "border border-gray-300 hover:bg-gray-50"
								}`}
							>
								{page}
							</button>
						))}
						<button
							onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Sau
						</button>
					</div>
				</div>
			</div>

			{showFormulaModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
        Công thức tính lương Seller
        <button
          onClick={() => setShowFormulaModal(false)}
          className="text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </h3>
      <div className="text-sm text-gray-700 space-y-3">
        <p><strong>P1 – Lương cơ bản:</strong><br/>
          = {`5.000.000 VND × (Số đơn hoàn thành / 10)`} nếu chưa đạt KPI<br/>
          = {`5.000.000 VND`} nếu đạt hoặc vượt KPI
        </p>
        <p><strong>P2 – Thưởng điểm:</strong><br/>
          + Hoàn thành KPI trước ngày 20: <strong>+5 điểm</strong><br/>
          + Mỗi đơn vượt KPI: <strong>+1 điểm</strong><br/>
          → <em>1 điểm = 100.000 VND</em>
        </p>
        <p><strong>P3 – Hoa hồng:</strong><br/>
          = <strong>2%</strong> × Tổng giá trị đơn hoàn thành trong tháng
        </p>
        <hr/>
        <p><strong>Tổng lương = P1 + P2 + P3</strong></p>
      </div>
      <div className="text-right">
        <button
          onClick={() => setShowFormulaModal(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}
		</div>
	);
}
