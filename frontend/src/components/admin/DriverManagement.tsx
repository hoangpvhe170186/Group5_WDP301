import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Ban,
  User,
  Truck,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { adminApi } from "@/services/admin.service";
import { useNavigate } from "react-router-dom";
import DriverDetail from "./DriverDetail";
import React from "react";
import { orderApi } from "@/services/order.service";
import DriverCreateModal from "./DriverCreateModal";
import { io } from "socket.io-client"; // THÊM DÒNG NÀY

interface Carrier {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehiclePlate: string;
  status: "Active" | "Inactive" | "Banned";
  avatar?: string;
  banReason?: string;
  created_at: string;
  orders?: CarrierOrder[];
  vehicleType?: string;
  vehicleCapacity?: number;
  vehicleStatus?: string;
}

interface CarrierOrder {
  _id: string;
  orderCode: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  scheduled_time?: string;
  total_price: number;
  customer_name: string;
  __customer_id?: string;
  __needs_price?: boolean;
  __order_key: string;
  __by_code?: boolean;
}

export default function DriverManagement() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Active" | "Inactive" | "Banned"
  >("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCarriers, setTotalCarriers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(
    null
  );
  const [showCarrierDetail, setShowCarrierDetail] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [carrierToBan, setCarrierToBan] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // 🚀 Fetch dữ liệu carrier từ API
  const fetchCarriers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy danh sách carriers với phân trang
      const response = await adminApi.getPaginationCarriers(
        currentPage,
        itemsPerPage
      );

      // Fetch orders cho từng carrier
      const carriersWithOrders = await Promise.all(
        response.data.map(async (carrier: any) => {
          try {
            const ordersResponse = await adminApi.getCarrierOrders(
              carrier.id || carrier._id,
              1,
              5
            );

            // Lấy danh sách đơn từ nhiều kiểu trả về khác nhau
            const rawOrders: any[] =
              ordersResponse?.orders ??
              ordersResponse?.data?.orders ??
              ordersResponse?.data ??
              [];

            // Chuẩn hóa từng đơn
            const normalizedOrders: CarrierOrder[] = rawOrders.map(
              (o: any) => {
                const orderId = o._id || o.id || null;
                const orderCode = o.orderCode || o.code || o.order_code || "";

                const customer_id =
                  (typeof o.customer === "string" && o.customer) ||
                  (typeof o.customerId === "string" && o.customerId) ||
                  o.customer?._id ||
                  o.customerId?._id ||
                  o.customer_id ||
                  undefined;

                const customer_name =
                  o.customer?.full_name ??
                  o.customer?.fullName ??
                  o.customer?.name ??
                  o.customerName ??
                  o.customer_name ??
                  "Không rõ";

                let total_price =
                  o.total_price ??
                  o.totalPrice ??
                  o.total ??
                  o.amount ??
                  o.payment?.total ??
                  o.pricing?.total ??
                  o.summary?.grandTotal;

                if (
                  (total_price === undefined || total_price === null) &&
                  Array.isArray(o.items)
                ) {
                  const itemsTotal = o.items.reduce(
                    (acc: number, it: any) => {
                      const unit = Number(
                        it?.price ?? it?.unitPrice ?? it?.amount ?? 0
                      );
                      const qty = Number(it?.quantity ?? it?.qty ?? 1);
                      return acc + unit * qty;
                    },
                    0
                  );
                  const shipping = Number(
                    o.shippingFee ?? o.fees?.shipping ?? o.deliveryFee ?? 0
                  );
                  const discount = Number(
                    o.discount ?? o.promotion?.discount ?? 0
                  );
                  total_price = itemsTotal + shipping - discount;
                }

                return {
                  _id: orderId || orderCode,
                  orderCode: orderCode || "—",
                  status: String(o.status || "PENDING").toUpperCase(),
                  pickup_address:
                    o.pickup_address ??
                    o.pickupAddress ??
                    o.pickUpAddress ??
                    "—",
                  delivery_address:
                    o.delivery_address ??
                    o.deliveryAddress ??
                    o.dropoffAddress ??
                    "—",
                  scheduled_time: o.scheduled_time ?? o.scheduledAt,
                  total_price: Number(total_price ?? 0),
                  customer_name,

                  __customer_id: customer_id,
                  __needs_price: !(total_price > 0),
                  __order_key: orderId || orderCode,
                  __by_code: !orderId && !!orderCode,
                };
              }
            );

            return {
              _id: carrier.id,
              full_name: carrier.fullName,
              email: carrier.email,
              phone: carrier.phone || "Chưa cập nhật",
              licenseNumber: carrier.licenseNumber || "Chưa cập nhật",
              vehiclePlate: carrier.vehiclePlate || "Chưa cập nhật",
              status: carrier.status,
              avatar: carrier.avatar,
              banReason: carrier.banReason,
              created_at: carrier.createdAt,
              orders: normalizedOrders,
              vehicleType: carrier.vehicle?.type || "Chưa cập nhật",
              vehicleCapacity: carrier.vehicle?.capacity || 0,
              vehicleStatus: carrier.vehicle?.status || "Unknown",
            };
          } catch (err) {
            console.error(
              `Error fetching orders for carrier ${carrier.id}:`,
              err
            );
            return {
              _id: carrier.id,
              full_name: carrier.fullName,
              email: carrier.email,
              phone: carrier.phone || "Chưa cập nhật",
              licenseNumber: carrier.licenseNumber || "Chưa cập nhật",
              vehiclePlate: carrier.vehiclePlate || "Chưa cập nhật",
              status: carrier.status,
              avatar: carrier.avatar,
              banReason: carrier.banReason,
              created_at: carrier.createdAt,
              orders: [],
            };
          }
        })
      );

      // Hydrate missing customer names and prices
      const needDetailKeys = new Map<string, "id" | "code">();
      for (const c of carriersWithOrders) {
        for (const o of c.orders ?? []) {
          if (o.customer_name === "Không rõ" || o.__needs_price) {
            needDetailKeys.set(o.__order_key, o.__by_code ? "code" : "id");
          }
        }
      }

      const detailMap: Record<string, { name?: string; total?: number }> = {};

      await Promise.all(
        Array.from(needDetailKeys.entries()).map(async ([key, how]) => {
          try {
            let od: any | null = null;

            if (how === "id" && key) {
              od = await orderApi.getDetail(key);
            } else {
              const resp = await (orderApi as any).getOrderByCode?.(key);
              od = resp?.data ?? resp ?? null;
            }

            if (!od) return;

            const name =
              od?.customer?.full_name ??
              od?.customer?.fullName ??
              od?.customer?.name ??
              "";

            let total: number | undefined =
              typeof od?.totalPrice === "number" ? od.totalPrice : undefined;

            if (
              (total === undefined || total === null) &&
              Array.isArray(od?.items)
            ) {
              const itemsTotal = od.items.reduce((acc: number, it: any) => {
                const unit = Number(
                  it?.price ?? it?.unitPrice ?? it?.amount ?? 0
                );
                const qty = Number(it?.quantity ?? it?.qty ?? 1);
                return acc + unit * qty;
              }, 0);
              const shipping = Number(
                od?.shippingFee ?? od?.fees?.shipping ?? od?.deliveryFee ?? 0
              );
              const discount = Number(
                od?.discount ?? od?.promotion?.discount ?? 0
              );
              total = itemsTotal + shipping - discount;
            }

            detailMap[key] = {
              name: name || undefined,
              total: total !== undefined ? Number(total) : undefined,
            };
          } catch {}
        })
      );

      // Áp kết quả hydrate
      const hydrated = carriersWithOrders.map((c) => ({
        ...c,
        orders: (c.orders ?? []).map((o) => ({
          ...o,
          customer_name:
            o.customer_name && o.customer_name !== "Không rõ"
              ? o.customer_name
              : detailMap[o.__order_key]?.name ?? "Không rõ",
          total_price: detailMap[o.__order_key]?.total ?? o.total_price,
        })),
      }));

      setCarriers(hydrated);
      setTotalPages(response.totalPages);
      setTotalCarriers(response.total);
    } catch (err: any) {
      console.error("❌ Lỗi khi tải danh sách carrier:", err);
      setError(err.message || "Lỗi khi tải danh sách carrier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, [currentPage]);

  // Socket.io để nhận thông báo realtime khi có tài xế mới đăng ký
  useEffect(() => {
    const socket = io("http://localhost:4000");
    
    console.log("🔌 Socket connected for driver management");
    
    socket.on("new_driver_registration", () => {
      console.log("🔄 New driver registration detected, refreshing list...");
      fetchCarriers(); // Refresh danh sách tài xế
    });

    socket.on("new_notification", (data) => {
      if (data.type === "DriverInterview") {
        console.log("📢 New driver interview notification, refreshing...");
        fetchCarriers();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  // 🚀 Fetch dữ liệu carrier từ API
  useEffect(() => {
    const fetchCarriers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Gọi API để lấy danh sách carriers với phân trang
        const response = await adminApi.getPaginationCarriers(
          currentPage,
          itemsPerPage
        );

        // Fetch orders cho từng carrier
        const carriersWithOrders = await Promise.all(
          response.data.map(async (carrier: any) => {
            try {
              const ordersResponse = await adminApi.getCarrierOrders(
                carrier.id || carrier._id,
                1,
                5
              );

              // Lấy danh sách đơn từ nhiều kiểu trả về khác nhau
              const rawOrders: any[] =
                ordersResponse?.orders ??
                ordersResponse?.data?.orders ??
                ordersResponse?.data ??
                [];

              // Chuẩn hóa từng đơn
              const normalizedOrders: CarrierOrder[] = rawOrders.map(
                (o: any) => {
                  const orderId = o._id || o.id || null;
                  const orderCode = o.orderCode || o.code || o.order_code || "";

                  const customer_id =
                    (typeof o.customer === "string" && o.customer) ||
                    (typeof o.customerId === "string" && o.customerId) ||
                    o.customer?._id ||
                    o.customerId?._id ||
                    o.customer_id ||
                    undefined;

                  const customer_name =
                    o.customer?.full_name ??
                    o.customer?.fullName ??
                    o.customer?.name ??
                    o.customerName ??
                    o.customer_name ??
                    "Không rõ";

                  let total_price =
                    o.total_price ??
                    o.totalPrice ??
                    o.total ??
                    o.amount ??
                    o.payment?.total ??
                    o.pricing?.total ??
                    o.summary?.grandTotal;

                  if (
                    (total_price === undefined || total_price === null) &&
                    Array.isArray(o.items)
                  ) {
                    const itemsTotal = o.items.reduce(
                      (acc: number, it: any) => {
                        const unit = Number(
                          it?.price ?? it?.unitPrice ?? it?.amount ?? 0
                        );
                        const qty = Number(it?.quantity ?? it?.qty ?? 1);
                        return acc + unit * qty;
                      },
                      0
                    );
                    const shipping = Number(
                      o.shippingFee ?? o.fees?.shipping ?? o.deliveryFee ?? 0
                    );
                    const discount = Number(
                      o.discount ?? o.promotion?.discount ?? 0
                    );
                    total_price = itemsTotal + shipping - discount;
                  }

                  return {
                    _id: orderId || orderCode, // để React có key ổn định
                    orderCode: orderCode || "—",
                    status: String(o.status || "PENDING").toUpperCase(),
                    pickup_address:
                      o.pickup_address ??
                      o.pickupAddress ??
                      o.pickUpAddress ??
                      "—",
                    delivery_address:
                      o.delivery_address ??
                      o.deliveryAddress ??
                      o.dropoffAddress ??
                      "—",
                    scheduled_time: o.scheduled_time ?? o.scheduledAt,
                    total_price: Number(total_price ?? 0),
                    customer_name,

                    __customer_id: customer_id,
                    __needs_price: !(total_price > 0),
                    __order_key: orderId || orderCode, // ✨ luôn có khóa
                    __by_code: !orderId && !!orderCode, // ✨ nếu không có id → hydrate bằng code
                  };
                }
              );

              return {
                _id: carrier.id,
                full_name: carrier.fullName,
                email: carrier.email,
                phone: carrier.phone || "Chưa cập nhật",
                licenseNumber: carrier.licenseNumber || "Chưa cập nhật",
                vehiclePlate: carrier.vehiclePlate || "Chưa cập nhật",
                status: carrier.status,
                avatar: carrier.avatar,
                banReason: carrier.banReason,
                created_at: carrier.createdAt,
                orders: normalizedOrders,
                vehicleType: carrier.vehicle?.type || "Chưa cập nhật",
                vehicleCapacity: carrier.vehicle?.capacity || 0,
                vehicleStatus: carrier.vehicle?.status || "Unknown",
              };
            } catch (err) {
              console.error(
                `Error fetching orders for carrier ${carrier.id}:`,
                err
              );
              return {
                _id: carrier.id,
                full_name: carrier.fullName,
                email: carrier.email,
                phone: carrier.phone || "Chưa cập nhật",
                licenseNumber: carrier.licenseNumber || "Chưa cập nhật",
                vehiclePlate: carrier.vehiclePlate || "Chưa cập nhật",
                status: carrier.status,
                avatar: carrier.avatar,
                banReason: carrier.banReason,
                created_at: carrier.createdAt,
                orders: [],
              };
            }
          })
        );

        // Hydrate missing customer names and prices
        const missingCustomerIds = new Set<string>();
        // ==== HYDRATE CUSTOMER NAME + TOTAL PRICE TỪ CHI TIẾT ĐƠN (ID hoặc CODE) ====
        const needDetailKeys = new Map<string, "id" | "code">();
        for (const c of carriersWithOrders) {
          for (const o of c.orders ?? []) {
            if (o.customer_name === "Không rõ" || o.__needs_price) {
              needDetailKeys.set(o.__order_key, o.__by_code ? "code" : "id");
            }
          }
        }

        const detailMap: Record<string, { name?: string; total?: number }> = {};

        await Promise.all(
          Array.from(needDetailKeys.entries()).map(async ([key, how]) => {
            try {
              let od: any | null = null;

              if (how === "id" && key) {
                // ✅ Dùng đúng hàm có thật trong order.service.ts
                od = await orderApi.getDetail(key);
              } else {
                // ✅ Theo code: chỉ chạy nếu service có hàm này
                const resp = await (orderApi as any).getOrderByCode?.(key);
                od = resp?.data ?? resp ?? null;
              }

              if (!od) return;

              // Seller normalize: customer_id đã populate -> ở service trả về "customer"
              const name =
                od?.customer?.full_name ??
                od?.customer?.fullName ??
                od?.customer?.name ??
                "";

              // Service đã chuẩn hóa "totalPrice"
              let total: number | undefined =
                typeof od?.totalPrice === "number" ? od.totalPrice : undefined;

              // Fallback tự tính nếu code-path trả raw object
              if (
                (total === undefined || total === null) &&
                Array.isArray(od?.items)
              ) {
                const itemsTotal = od.items.reduce((acc: number, it: any) => {
                  const unit = Number(
                    it?.price ?? it?.unitPrice ?? it?.amount ?? 0
                  );
                  const qty = Number(it?.quantity ?? it?.qty ?? 1);
                  return acc + unit * qty;
                }, 0);
                const shipping = Number(
                  od?.shippingFee ?? od?.fees?.shipping ?? od?.deliveryFee ?? 0
                );
                const discount = Number(
                  od?.discount ?? od?.promotion?.discount ?? 0
                );
                total = itemsTotal + shipping - discount;
              }

              detailMap[key] = {
                name: name || undefined,
                total: total !== undefined ? Number(total) : undefined,
              };
            } catch {}
          })
        );

        // Áp kết quả hydrate
        const hydrated = carriersWithOrders.map((c) => ({
          ...c,
          orders: (c.orders ?? []).map((o) => ({
            ...o,
            customer_name:
              o.customer_name && o.customer_name !== "Không rõ"
                ? o.customer_name
                : detailMap[o.__order_key]?.name ?? "Không rõ",
            total_price: detailMap[o.__order_key]?.total ?? o.total_price,
          })),
        }));

        setCarriers(hydrated);

        setTotalPages(response.totalPages);
        setTotalCarriers(response.total);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải danh sách carrier:", err);
        setError(err.message || "Lỗi khi tải danh sách carrier");
      } finally {
        setLoading(false);
      }
    };

    fetchCarriers();
  }, [currentPage]);
  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "text-green-600 bg-green-100";
      case "In Use":
        return "text-blue-600 bg-blue-100";
      case "Maintenance":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getVehicleStatusText = (status: string) => {
    switch (status) {
      case "Available":
        return "Sẵn sàng";
      case "In Use":
        return "Đang sử dụng";
      case "Maintenance":
        return "Bảo trì";
      default:
        return "Không xác định";
    }
  };
  // ⚙️ Hàm xử lý hành động
  const handleViewCarrier = (carrierId: string) => {
    setSelectedCarrierId(carrierId);
    setShowCarrierDetail(true);
  };

  const handleBanCarrier = async (carrierId: string) => {
    setCarrierToBan(carrierId);
    setShowBanModal(true);
  };

  const confirmBanCarrier = async () => {
    if (!carrierToBan || !banReason.trim()) return;

    try {
      await adminApi.updateUserStatus(carrierToBan, {
        status: "Banned",
        banReason: banReason.trim(),
      });

      // Update local state
      setCarriers(
        carriers.map((carrier) =>
          carrier._id === carrierToBan
            ? { ...carrier, status: "Banned", banReason: banReason.trim() }
            : carrier
        )
      );

      setShowBanModal(false);
      setBanReason("");
      setCarrierToBan(null);
    } catch (err: any) {
      setError("Lỗi khi khóa carrier");
      console.error(err);
    }
  };

  const handleUnbanCarrier = async (carrierId: string) => {
    try {
      await adminApi.updateUserStatus(carrierId, {
        status: "Active",
        banReason: "",
      });

      // Update local state
      setCarriers(
        carriers.map((carrier) =>
          carrier._id === carrierId
            ? { ...carrier, status: "Active", banReason: "" }
            : carrier
        )
      );
    } catch (err: any) {
      setError("Lỗi khi mở khóa carrier");
      console.error(err);
    }
  };

  const handleBackFromDetail = () => {
    setShowCarrierDetail(false);
    setSelectedCarrierId(null);
  };

  const toggleExpandRow = (carrierId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(carrierId)) {
      newExpanded.delete(carrierId);
    } else {
      newExpanded.add(carrierId);
    }
    setExpandedRows(newExpanded);
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

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "ON_THE_WAY":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
      case "ACCEPTED":
        return "bg-yellow-100 text-yellow-800";
      case "DELIVERED":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: "Chờ xử lý",
      CONFIRMED: "Đã xác nhận",
      ASSIGNED: "Đã phân công",
      ACCEPTED: "Đã nhận đơn",
      ON_THE_WAY: "Đang giao",
      ARRIVED: "Đã đến nơi",
      DELIVERING: "Đang giao hàng",
      DELIVERED: "Đã giao",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      INCIDENT: "Sự cố",
    };

    return statusMap[status] || status;
  };

  const filteredCarriers = carriers.filter((carrier) => {
    const matchesSearch =
      carrier.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (carrier.phone && carrier.phone.includes(searchTerm)) ||
      (carrier.vehiclePlate &&
        carrier.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" || carrier.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCarriers = filteredCarriers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // 🧭 Loading & Error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Đang tải danh sách carrier...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 font-semibold mt-10">
        ❌ Lỗi: {error}
      </div>
    );
  }

  // Nếu đang hiển thị chi tiết carrier
  if (showCarrierDetail && selectedCarrierId) {
    return (
      <DriverDetail
        carrierId={selectedCarrierId}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Khóa Carrier</h3>
            <p className="text-gray-600 mb-4">
              Vui lòng nhập lý do khóa carrier:
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do khóa..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmBanCarrier}
                disabled={!banReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
              >
                Xác nhận khóa
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setCarrierToBan(null);
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
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài xế</h1>
        <button
          onClick={() => setOpenCreate(true)}
          className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Thêm tài xế
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng tài xế</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCarriers}
              </p>
            </div>
            <Truck className="w-8 h-8 text-orange-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">
                {carriers.filter((d) => d.status === "Active").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Không hoạt động</p>
              <p className="text-2xl font-bold text-gray-600">
                {carriers.filter((d) => d.status === "Inactive").length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bị khóa</p>
              <p className="text-2xl font-bold text-red-600">
                {carriers.filter((d) => d.status === "Banned").length}
              </p>
            </div>
            <Ban className="w-8 h-8 text-red-500 opacity-20" />
          </div>
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
                placeholder="Tìm kiếm theo tên, email, SĐT, ID, biển số xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Carriers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thông tin tài xế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Liên hệ & Xe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCarriers.map((carrier) => (
                <React.Fragment key={carrier._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpandRow(carrier._id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        disabled={
                          !carrier.orders || carrier.orders.length === 0
                        }
                      >
                        {carrier.orders && carrier.orders.length > 0 ? (
                          expandedRows.has(carrier._id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          {carrier.avatar ? (
                            <img
                              src={carrier.avatar}
                              alt={carrier.full_name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <User className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {carrier.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {carrier._id}
                          </div>
                          <div className="text-sm text-gray-500">
                            GPLX: {carrier.licenseNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {carrier.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {carrier.phone}
                        </div>

                        {/* Thêm thông tin xe chi tiết */}
                        <div className="mt-2 p-2 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between text-sm text-gray-900 font-medium mb-1">
                            <div className="flex items-center">
                              <Truck className="w-4 h-4 mr-2 text-orange-500" />
                              Thông tin xe
                            </div>
                            {carrier.vehicleStatus &&
                              carrier.vehicleStatus !== "Unknown" && (
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${getVehicleStatusColor(
                                    carrier.vehicleStatus
                                  )}`}
                                >
                                  {getVehicleStatusText(carrier.vehicleStatus)}
                                </span>
                              )}
                          </div>

                          {carrier.vehiclePlate &&
                          carrier.vehiclePlate !== "Chưa cập nhật" ? (
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Biển số:</span>
                                <span className="font-medium">
                                  {carrier.vehiclePlate}
                                </span>
                              </div>
                              {carrier.vehicleType &&
                                carrier.vehicleType !== "Chưa cập nhật" && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Loại xe:
                                    </span>
                                    <span className="font-medium">
                                      {carrier.vehicleType}
                                    </span>
                                  </div>
                                )}
                              {carrier.vehicleCapacity &&
                                carrier.vehicleCapacity > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Tải trọng:
                                    </span>
                                    <span className="font-medium">
                                      {carrier.vehicleCapacity} kg
                                    </span>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic text-center py-1">
                              Chưa có thông tin xe
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {carrier.orders ? carrier.orders.length : 0} đơn hàng
                      </div>
                      <div className="text-xs text-gray-500">
                        {carrier.orders
                          ? carrier.orders.filter((order) =>
                              ["COMPLETED", "DELIVERED"].includes(order.status)
                            ).length
                          : 0}{" "}
                        đã hoàn thành
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          carrier.status
                        )}`}
                      >
                        {getStatusIcon(carrier.status)}
                        <span className="ml-1">
                          {getStatusText(carrier.status)}
                        </span>
                      </span>
                      {carrier.banReason && (
                        <div
                          className="text-xs text-red-600 mt-1 max-w-xs truncate"
                          title={carrier.banReason}
                        >
                          {carrier.banReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewCarrier(carrier._id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {carrier.status === "Banned" ? (
                          <button
                            onClick={() => handleUnbanCarrier(carrier._id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Mở khóa"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanCarrier(carrier._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Khóa tài khoản"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(carrier._id) &&
                    carrier.orders &&
                    carrier.orders.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">
                              Đơn hàng hiện tại
                            </h4>
                            <div className="overflow-x-auto bg-white border rounded">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                      Mã đơn
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                      Khách hàng
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                      Giá trị
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                      Địa chỉ lấy
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                      Địa chỉ giao
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                                      Trạng thái
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {carrier.orders.map((order) => (
                                    <tr key={order._id} className="border-t">
                                      <td className="px-3 py-2 font-medium text-gray-900">
                                        {order.orderCode}
                                      </td>
                                      <td className="px-3 py-2">
                                        {order.customer_name}
                                      </td>
                                      <td className="px-3 py-2">
                                        {`₫${Number(
                                          order.total_price ?? 0
                                        ).toLocaleString("vi-VN")}`}
                                      </td>

                                      <td
                                        className="px-3 py-2 max-w-[280px] truncate"
                                        title={order.pickup_address}
                                      >
                                        {order.pickup_address}
                                      </td>
                                      <td
                                        className="px-3 py-2 max-w-[280px] truncate"
                                        title={order.delivery_address}
                                      >
                                        {order.delivery_address}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(
                                            order.status
                                          )}`}
                                        >
                                          {getOrderStatusText(order.status)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <DriverCreateModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={(id) => {
            setOpenCreate(false);
            // Refresh danh sách hiện tại
            // Cách nhanh: về trang 1 hoặc gọi lại fetch
            setCurrentPage(1);
            // hoặc: window.location.reload();
          }}
        />
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, totalCarriers)} của{" "}
            {totalCarriers} tài xế
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
                  currentPage === page
                    ? "bg-orange-500 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
