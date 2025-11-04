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
} from "lucide-react";

// ====== Configs ======
const ITEMS_PER_PAGE = 10;
const BASE_SALARY_VND = 5_000_000; // 5 triệu VND
const KPI_MIN_ORDERS = 10; // KPI: 10 đơn/tháng
const COMMISSION_RATE = 0.05; // 2%

// ====== Types used locally ======
type SellerStats = {
	user: UserType;
	completedOrders: number;
	totalCompletedValue: number; // tổng giá trị đơn Completed
	commission: number; // 2% of totalCompletedValue
	baseAdjusted: number; // lương cơ bản sau KPI
	totalPayout: number; // baseAdjusted + commission
	rating?: number | null; // lazy load by seller
};

type OrderLite = {
	id: string;
	code: string;
	status: string;
	price: number;
	createdAt: string;
	pickupAddress: string;
	deliveryAddress: string;
	sellerId?: string | null;
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
	const d = new Date(dateStr);
	return d.getFullYear() === year && d.getMonth() === monthIndex;
}

function calcPayout(completedOrders: number, totalCompletedValue: number) {
	const commission = totalCompletedValue * COMMISSION_RATE;
	const baseAdjusted =
		completedOrders >= KPI_MIN_ORDERS
			? BASE_SALARY_VND
			: Math.floor(BASE_SALARY_VND * (completedOrders / KPI_MIN_ORDERS)); // giảm lương tỷ lệ theo KPI
	const totalPayout = baseAdjusted + commission;
	return { commission, baseAdjusted, totalPayout };
}

export default function SellerManagement() {
	// ===== UI state =====
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
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

	// ===== Fetch data =====
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

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
					pickupAddress: o.pickup_address || "",
					deliveryAddress: o.delivery_address || "",
					sellerId: o.seller_id ? String(o.seller_id._id || o.seller_id) : null,
				}));
				setOrders(normalized);
			} catch (e: any) {
				console.error(e);
				setError(e?.message || "Lỗi tải dữ liệu");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage]);

	// ===== Build stats for current page sellers and selected month =====
	useEffect(() => {
		if (!sellers.length) return;
		const byId: Record<string, SellerStats> = {};
		for (const s of sellers) {
			const sellerOrders = orders.filter(
				(o) => o.sellerId === s.id && isSameMonth(o.createdAt, selectedYear, selectedMonth)
			);
			const completed = sellerOrders.filter((o) => o.status === "COMPLETED");
			const totalValue = completed.reduce((sum, o) => sum + (o.price || 0), 0);
			const { commission, baseAdjusted, totalPayout } = calcPayout(completed.length, totalValue);
			byId[s.id] = {
				user: s,
				completedOrders: completed.length,
				totalCompletedValue: totalValue,
				commission,
				baseAdjusted,
				totalPayout,
				rating: sellerRating[s.id] ?? null,
			};
		}
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
				.filter(
					(o) => o.sellerId === seller.id && isSameMonth(o.createdAt, selectedYear, selectedMonth)
				)
				.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			setOrdersForSeller(sellerOrders);

			// Lazy compute rating: average rating from feedbacks of seller's orders (only Completed)
			const completed = sellerOrders.filter((o) => o.status === "Completed");
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
				<h2 className="text-xl font-semibold">Quản lý Seller</h2>
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
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
							<th className="text-left px-3 py-2">Seller</th>
							<th className="text-left px-3 py-2">Liên hệ</th>
							<th className="text-right px-3 py-2">Đơn Completed</th>
							<th className="text-right px-3 py-2">Giá trị Completed</th>
							<th className="text-right px-3 py-2">Commission (2%)</th>
							<th className="text-right px-3 py-2">Lương cơ bản</th>
							<th className="text-right px-3 py-2">Payout</th>
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
									<td className="px-3 py-2">
										<div className="font-medium">{s.fullName || "(Không tên)"}</div>
										<div className="text-xs text-gray-500">{s.id}</div>
									</td>
									<td className="px-3 py-2">
										<div>{s.email}</div>
										<div className="text-xs text-gray-500">{s.phone || "—"}</div>
									</td>
									<td className="px-3 py-2 text-right">{st?.completedOrders ?? 0}</td>
									<td className="px-3 py-2 text-right">{formatCurrencyVND(st?.totalCompletedValue ?? 0)}</td>
									<td className="px-3 py-2 text-right">{formatCurrencyVND(st?.commission ?? 0)}</td>
									<td className="px-3 py-2 text-right">{formatCurrencyVND(st?.baseAdjusted ?? BASE_SALARY_VND)}</td>
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
								<td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
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
		</div>
	);
}