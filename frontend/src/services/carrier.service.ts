import api from "@/lib/axios";
import type { CarrierProfile, JobItem, JobStatus } from "@/types/carrier";

export type TrackingItem = {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
};

const getAuthToken = (): string => {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("auth_token") ||
    ""
  );
};

const normalizeStatus = (s?: string): JobStatus | "ASSIGNED" | "DECLINED" | "CANCELLED" => {
  const raw = (s || "").toUpperCase();
  const map: Record<string, JobStatus | "ASSIGNED" | "DECLINED" | "CANCELLED"> = {
    PENDING: "ASSIGNED",
    ASSIGNED: "ASSIGNED",
    ACCEPTED: "ACCEPTED",
    CONFIRMED: "CONFIRMED",
    ON_THE_WAY: "ON_THE_WAY",
    ARRIVED: "ARRIVED",
    DELIVERING: "DELIVERING",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    DECLINED: "DECLINED",
    CANCELLED: "CANCELLED",
    CANCELED: "CANCELLED",
    INPROGRESS: "DELIVERING",
    INCIDENT: "DELIVERING", // map phụ
    PAUSED: "DELIVERING",
  };
  return map[raw] ?? ("ASSIGNED" as const);
};

// helper Decimal128 -> number
const toNum = (v: any) =>
  v?.$numberDecimal ? Number(v.$numberDecimal) :
  (typeof v === "object" && v?._bsontype === "Decimal128") ? Number(v.toString()) :
  Number(v ?? 0);

export const carrierApi = {
  async getProfile(): Promise<CarrierProfile> {
    const { data } = await api.get("/carrier/me", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data;
  },

  async updateProfile(payload: Partial<CarrierProfile>): Promise<CarrierProfile> {
    const { data } = await api.put("/carrier/me", payload, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data;
  },

  async listOrders(): Promise<{ orders: JobItem[] }> {
    const { data } = await api.get("/carrier/orders", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    const rawOrders = Array.isArray(data) ? data : data?.orders || [];

    const orders: JobItem[] = rawOrders.map((o: any) => ({
      id: String(o.id ?? o._id),
      orderCode: o.orderCode ?? `ORD-${String(o.id ?? o._id).slice(-6).toUpperCase()}`,
      customerName: o.customer?.name || o.customer?.full_name || "",
      pickup: { address: o.pickup?.address || o.pickup_address || "" },
      dropoff: { address: o.dropoff?.address || o.delivery_address || "" },
      goodsSummary: o.goodsSummary || "",
      scheduledTime: o.scheduledTime || (o.scheduled_time ? new Date(o.scheduled_time).toLocaleString("vi-VN") : undefined),
      estimatePrice: o.totalPrice ?? o.total_price,
      status: normalizeStatus(o.status) as JobStatus,
    }));

    return { orders };
  },

  async listHistory(): Promise<JobItem[]> {
    const { data } = await api.get("/carrier/orders?include=all", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    const rawOrders = Array.isArray(data) ? data : data?.orders || [];

    return rawOrders
      .map((o: any) => ({
        id: String(o.id ?? o._id),
        orderCode: o.orderCode ?? `ORD-${String(o.id ?? o._id).slice(-6).toUpperCase()}`,
        customerName: o.customer?.name || o.customer?.full_name || "",
        pickup: { address: o.pickup?.address || o.pickup_address || "" },
        dropoff: { address: o.dropoff?.address || o.delivery_address || "" },
        goodsSummary: o.goodsSummary || "",
        scheduledTime: o.scheduledTime || (o.scheduled_time ? new Date(o.scheduled_time).toLocaleString("vi-VN") : undefined),
        estimatePrice: o.totalPrice ?? o.total_price,
        status: normalizeStatus(o.status) as JobStatus,
      }))
      .filter((o: JobItem) => ["COMPLETED", "CANCELLED", "DECLINED"].includes(o.status));
  },

  async jobDetail(orderId: string): Promise<any> {
    const { data } = await api.get(`/carrier/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    const goods = (data.goods || []).map((g: any) => ({
      id: String(g.id ?? g._id),
      description: g.description ?? "",
      quantity: Number(g.quantity ?? 0),
      weight: toNum(g.weight),
      fragile: !!g.fragile,
    }));

    const trackings: TrackingItem[] = (data.trackings || []).map((t: any) => ({
      id: String(t._id),
      status: t.status,
      note: t.note || "",
      createdAt: t.createdAt,
    }));

    return {
      id: String(data._id),
      orderCode: data.orderCode ?? `ORD-${String(data._id).slice(-6).toUpperCase()}`,
      pickup: { address: data.pickup_address },
      dropoff: { address: data.delivery_address },
      goodsSummary: data.goodsSummary || "",
      status: normalizeStatus(data.status),
      goods,
      trackings,
    };
  },

  async acceptJob(orderId: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data;
  },

  async declineJob(orderId: string, reason?: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/decline`,
      { reason },
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data;
  },

  async confirmContract(orderId: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/confirm-contract`,
      {},
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data;
  },

  async updateProgress(orderId: string, status: JobStatus, note?: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/progress`,
      { status, note },
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data;
  },

  async confirmDelivery(orderId: string, signatureUrl?: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/confirm-delivery`,
      { signatureUrl },
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data;
  },

  // 🔥 NEW: lưu tracking riêng
  async addTracking(orderId: string, status: string, note?: string) {
    const { data } = await api.post(
      `/order-tracking/${orderId}`,
      { status, note },
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    return data;
  },

  async getTrackings(orderId: string): Promise<TrackingItem[]> {
    const { data } = await api.get(`/order-tracking/${orderId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const list = data?.trackings || [];
    return list.map((t: any) => ({
      id: String(t._id),
      status: t.status,
      note: t.note || "",
      createdAt: t.createdAt,
    }));
  },

  async reportIncident({ orderId, type, description, photos }: { orderId: string; type: string; description: string; photos?: File[] }) {
    const form = new FormData();
    form.append("type", type);
    form.append("description", description);
    (photos || []).forEach((p) => form.append("photos", p));
    const { data } = await api.post(`/carrier/orders/${orderId}/incidents`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return data;
  },
};
