import { useState, useEffect, useMemo } from "react";
import { adminApi, type User as UserType, getAuthToken } from "@/services/admin.service";
import api from "@/lib/axios";
import {
	TrendingUp,
	Users,
	Package,
	DollarSign,
	Search,
	ChevronLeft,
	ChevronRight,
	Eye,
	Star,
	Calendar,
	Trophy,
	BarChart3,
} from "lucide-react";
// @ts-ignore - recharts types may not be available but package is installed
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ====== Configs ======
const ITEMS_PER_PAGE = 10;
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
	rating?: number | null; // lazy load by seller
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

export default function SellerManagement() {
	// ===== UI state =====
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	// period selection (default: current month)
	const now = new Date();
	const [selectedYear, setSelectedYear] = useState(now.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11

	// data
	const [sellers, setSellers] = useState<UserType[]>([]);
	const [totalSellers, setTotalSellers] = useState(0);
	const [orders, setOrders] = useState<OrderLite[]>([]);

	// derived
	const [statsBySeller, setStatsBySeller] = useState<Record<string, SellerStats>>({});

	// modal
	const [openOrdersForSeller, setOpenOrdersForSeller] = useState<UserType | null>(null);
	const [ordersForSeller, setOrdersForSeller] = useState<OrderLite[]>([]);
	const [sellerRating, setSellerRating] = useState<Record<string, number | null>>({});
	const [modalLoading, setModalLoading] = useState(false);
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
				rating: sellerRating[s.id] ?? null,
			};
		}
		
		// Xếp hạng theo totalPayout
		const sortedSellers = Object.values(byId).sort((a, b) => b.totalPayout - a.totalPayout);
		sortedSellers.forEach((stat, index) => {
			byId[stat.user.id].rank = index + 1;
		});
		
		setStatsBySeller(byId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sellers, orders, selectedYear, selectedMonth, sellerRating]);

	// ===== Dashboard aggregates =====
	const dashboard = useMemo(() => {
		const pageSellers = sellers.map((s) => statsBySeller[s.id]).filter(Boolean);
		const totalCompletedOrders = pageSellers.reduce((sum, it) => sum + it.completedOrders, 0);
		const totalPayout = pageSellers.reduce((sum, it) => sum + it.totalPayout, 0);
		const avgRatingValues = pageSellers
			.map((it) => (typeof it.rating === "number" ? it.rating : null))
			.filter((r): r is number => r !== null);
		const avgRating = avgRatingValues.length
			? Math.round((avgRatingValues.reduce((a, b) => a + b, 0) / avgRatingValues.length) * 10) / 10
			: null;
		return { totalCompletedOrders, totalPayout, avgRating };
	}, [sellers, statsBySeller]);

	// ===== Open modal to view seller orders (and lazy-load rating) =====
	const openSellerOrders = async (seller: UserType) => {
		setOpenOrdersForSeller(seller);
		setModalLoading(true);
		try {
		const sellerOrders = orders
			.filter((o) => {
				if (o.sellerId !== seller.id) return false;
				// Nếu đơn COMPLETED, dùng completedAt; nếu không, dùng createdAt
				const dateToCheck = o.status === "COMPLETED" && o.completedAt ? o.completedAt : o.createdAt;
				return isSameMonth(dateToCheck, selectedYear, selectedMonth);
			})
			.sort((a, b) => {
				const dateA = a.completedAt || a.createdAt;
				const dateB = b.completedAt || b.createdAt;
				return new Date(dateB).getTime() - new Date(dateA).getTime();
			});
			setOrdersForSeller(sellerOrders);

			// Lazy compute rating: average rating from feedbacks of seller's orders (only Completed)
			const completed = sellerOrders.filter((o) => o.status === "COMPLETED");
			const token = getAuthToken();
			let ratings: number[] = [];
			for (const od of completed) {
				try {
					const { data } = await api.get(`/users/feedback/order/${od.id}`, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (data && typeof data.rating === "number") ratings.push(Number(data.rating));
				} catch {}
			}
			const avg = ratings.length
				? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
				: null;
			setSellerRating((prev) => ({ ...prev, [seller.id]: avg }));
		} finally {
			setModalLoading(false);
		}
	};

	const totalPages = Math.max(1, Math.ceil(totalSellers / ITEMS_PER_PAGE));

	return (
		<div className="p-4 md:p-6 space-y-6">
			{/* Header + period selection */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<h2 className="text-xl font-semibold flex items-center gap-2">
  Quản lý Seller
  <button
    onClick={() => setShowFormulaModal(true)}
    className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-gray-600 hover:bg-gray-100"
    title="Xem công thức tính lương"
  >
    ?
  </button>
</h2>
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

			{/* Dashboard cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="border rounded p-4 flex items-center gap-3">
					<Users className="w-10 h-10 text-blue-500" />
					<div>
						<div className="text-sm text-gray-500">Tổng seller (trang)</div>
						<div className="text-xl font-semibold">{sellers.length}</div>
					</div>
				</div>
				<div className="border rounded p-4 flex items-center gap-3">
					<Package className="w-10 h-10 text-green-600" />
					<div>
						<div className="text-sm text-gray-500">Đơn Completed (tháng)</div>
						<div className="text-xl font-semibold">{dashboard.totalCompletedOrders}</div>
					</div>
				</div>
				<div className="border rounded p-4 flex items-center gap-3">
					<TrendingUp className="w-10 h-10 text-orange-600" />
					<div>
						<div className="text-sm text-gray-500">Đơn đang thực hiện</div>
						<div className="text-xl font-semibold">
							{Object.values(statsBySeller).reduce((sum, s) => sum + s.inProgressOrders, 0)}
						</div>
					</div>
				</div>
				<div className="border rounded p-4 flex items-center gap-3">
					<DollarSign className="w-10 h-10 text-emerald-600" />
					<div>
						<div className="text-sm text-gray-500">Tổng payout ước tính</div>
						<div className="text-xl font-semibold">{formatCurrencyVND(dashboard.totalPayout)}</div>
					</div>
				</div>
			</div>

			{/* Average rating */}
			<div className="border rounded p-4 flex items-center gap-2">
				<TrendingUp className="w-5 h-5 text-purple-600" />
				<div className="text-sm text-gray-600">
					Đánh giá trung bình (trang):{" "}
					{dashboard.avgRating ? (
						<span className="font-medium">{dashboard.avgRating} / 5</span>
					) : (
						<span className="text-gray-400">Chưa có dữ liệu</span>
					)}
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

			{/* Search */}
			<div className="flex items-center gap-2">
				<div className="flex items-center border rounded px-3 py-2 w-full md:w-96">
					<Search className="w-4 h-4 text-gray-500 mr-2" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Tìm seller theo tên/email/điện thoại"
						className="w-full outline-none"
					/>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-auto border rounded">
				<table className="min-w-full text-sm">
					<thead className="bg-gray-50 text-gray-600">
						<tr>
							<th className="text-left px-3 py-2">Hạng</th>
							<th className="text-left px-3 py-2">Seller</th>
							<th className="text-left px-3 py-2">Liên hệ</th>
							<th className="text-right px-3 py-2">Đơn Completed</th>
							<th className="text-right px-3 py-2">Đơn đang thực hiện</th>
							<th className="text-right px-3 py-2">Giá trị Completed</th>
							<th className="text-right px-3 py-2">P1: Lương cứng</th>
							<th className="text-right px-3 py-2">P2: Thưởng (điểm)</th>
							<th className="text-right px-3 py-2">P3: Commission</th>
							<th className="text-right px-3 py-2">Tổng Payout</th>
							<th className="text-center px-3 py-2">Rating</th>
							<th className="text-center px-3 py-2">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{(sellers
							.filter((s) => {
								const q = search.trim().toLowerCase();
								if (!q) return true;
								return (
									s.fullName.toLowerCase().includes(q) ||
									s.email.toLowerCase().includes(q) ||
									(s.phone || "").toLowerCase().includes(q)
								);
							}) || []).map((s) => {
							const st = statsBySeller[s.id];
							return (
								<tr key={s.id} className="border-t">
									<td className="px-3 py-2 text-center">
										{st?.rank ? (
											<span className="inline-flex items-center gap-1">
												{st.rank <= 3 ? (
													<Trophy className={`w-4 h-4 ${
														st.rank === 1 ? "text-yellow-500" :
														st.rank === 2 ? "text-gray-400" :
														"text-orange-600"
													}`} />
												) : null}
												<span className="font-semibold">{st.rank}</span>
											</span>
										) : (
											<span className="text-gray-400">—</span>
										)}
									</td>
									<td className="px-3 py-2">
										<div className="font-medium">{s.fullName || "(Không tên)"}</div>
										<div className="text-xs text-gray-500">{s.id}</div>
									</td>
									<td className="px-3 py-2">
										<div>{s.email}</div>
										<div className="text-xs text-gray-500">{s.phone || "—"}</div>
									</td>
									<td className="px-3 py-2 text-right">{st?.completedOrders ?? 0}</td>
									<td className="px-3 py-2 text-right">{st?.inProgressOrders ?? 0}</td>
									<td className="px-3 py-2 text-right">{formatCurrencyVND(st?.totalCompletedValue ?? 0)}</td>
									<td className="px-3 py-2 text-right">{formatCurrencyVND(st?.baseAdjusted ?? BASE_SALARY_VND)}</td>
									<td className="px-3 py-2 text-right">
										<div>{formatCurrencyVND(st?.bonusSalary ?? 0)}</div>
										<div className="text-xs text-gray-500">({st?.bonusPoints ?? 0} điểm)</div>
									</td>
									<td className="px-3 py-2 text-right">{formatCurrencyVND(st?.commission ?? 0)}</td>
									<td className="px-3 py-2 text-right font-semibold">{formatCurrencyVND(st?.totalPayout ?? 0)}</td>
									<td className="px-3 py-2 text-center">
										{typeof st?.rating === "number" ? (
											<span className="inline-flex items-center gap-1 text-yellow-600">
												<Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
												{st.rating}
											</span>
										) : (
											<span className="text-gray-400">—</span>
										)}
									</td>
									<td className="px-3 py-2 text-center">
										<button
											onClick={() => openSellerOrders(s)}
											className="inline-flex items-center gap-1 px-2 py-1 border rounded hover:bg-gray-50"
										>
											<Eye className="w-4 h-4" /> Xem đơn
										</button>
									</td>
								</tr>
							);
						})}
						{!loading && sellers.length === 0 && (
							<tr>
								<td className="px-3 py-6 text-center text-gray-500" colSpan={12}>
									Không có seller nào
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between">
				<div className="text-sm text-gray-600">
					Trang {currentPage}/{totalPages} • Tổng {totalSellers}
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
						disabled={currentPage === 1}
						className="border rounded px-2 py-1 disabled:opacity-50"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
					<button
						onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
						disabled={currentPage === totalPages}
						className="border rounded px-2 py-1 disabled:opacity-50"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Orders Modal */}
			{openOrdersForSeller && (
				<div className="fixed inset-0 bg-black/30 flex items-end md:items-center justify-center z-50">
					<div className="bg-white w-full md:max-w-4xl rounded-t md:rounded shadow-lg max-h-[90vh] overflow-hidden">
						<div className="p-4 border-b flex items-center justify-between">
							<div>
								<div className="font-semibold">Đơn hàng của {openOrdersForSeller.fullName}</div>
								<div className="text-xs text-gray-500">
									Tháng {selectedMonth + 1}/{selectedYear}
								</div>
							</div>
							<button onClick={() => setOpenOrdersForSeller(null)} className="px-2 py-1 border rounded">
								Đóng
							</button>
						</div>
						<div className="p-4 space-y-3">
							{modalLoading ? (
								<div className="text-center text-gray-500">Đang tải...</div>
							) : ordersForSeller.length === 0 ? (
								<div className="text-center text-gray-500">Không có đơn hàng</div>
							) : (
								<div className="overflow-auto border rounded">
									<table className="min-w-full text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th className="text-left px-3 py-2">Mã đơn</th>
												<th className="text-left px-3 py-2">Trạng thái</th>
												<th className="text-right px-3 py-2">Giá trị</th>
												<th className="text-left px-3 py-2">Ngày tạo</th>
												<th className="text-left px-3 py-2">Từ</th>
												<th className="text-left px-3 py-2">Đến</th>
											</tr>
										</thead>
										<tbody>
											{ordersForSeller.map((o) => (
												<tr key={o.id} className="border-t">
													<td className="px-3 py-2">{o.code}</td>
													<td className="px-3 py-2">{o.status}</td>
													<td className="px-3 py-2 text-right">{formatCurrencyVND(o.price)}</td>
													<td className="px-3 py-2">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
													<td className="px-3 py-2">{o.pickupAddress}</td>
													<td className="px-3 py-2">{o.deliveryAddress}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{/* Rating summary for seller */}
							<div className="pt-2 text-sm text-gray-600">
								Đánh giá trung bình: {typeof sellerRating[openOrdersForSeller.id] === "number" ? `${sellerRating[openOrdersForSeller.id]} / 5` : "—"}
							</div>
						</div>
					</div>
				</div>
			)}
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