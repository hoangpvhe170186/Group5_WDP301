import axios from "axios";
import type { CarrierProfile, JobItem, JobStatus } from "@/types/carrier";

// Tạo axios instance cục bộ (không cần "@/lib/axios")
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const api = axios.create({
  baseURL: `${API_BASE}/api`, // BE mount /api
  withCredentials: true,
});

// Phase upload ảnh/video đối chiếu
export type EvidencePhase = "BEFORE" | "AFTER" | "INCIDENT";

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
  };
  return map[raw] ?? ("ASSIGNED" as const);
};

export const carrierApi = {
  // ========= PROFILE =========
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

  // ========= ORDERS =========
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
      scheduledTime:
        o.scheduledTime ||
        (o.scheduled_time ? new Date(o.scheduled_time).toLocaleString("vi-VN") : undefined),
      estimatePrice: o.totalPrice ?? o.total_price,
      status: normalizeStatus(o.status) as JobStatus,
    }));

    return { orders };
  },

  async listHistory(): Promise<JobItem[]> {
    const { orders } = await this.listOrders();
    return orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.status));
  },

  async jobDetail(orderId: string): Promise<JobItem> {
    const { data } = await api.get(`/carrier/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    return {
      id: String(data.id ?? data._id ?? orderId),
      orderCode: data.orderCode ?? `ORD-${String(data.id ?? data._id ?? orderId).slice(-6).toUpperCase()}`,
      customerName: data.customerName || data.customer?.name || "",
      pickup: { address: data.pickup?.address || data.pickup_address || "" },
      dropoff: { address: data.dropoff?.address || data.delivery_address || "" },
      goodsSummary: data.goodsSummary || "",
      scheduledTime:
        data.scheduledTime ||
        (data.scheduled_time ? new Date(data.scheduled_time).toLocaleString("vi-VN") : undefined),
      estimatePrice: data.totalPrice ?? data.total_price,
      status: normalizeStatus(data.status) as JobStatus,
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

  async declineJob(orderId: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/decline`,
      {},
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

  async updateProgress(orderId: string, status: JobStatus) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/progress`,
      { status },
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

 async reportIncident({
    orderId, type, description, photos,
  }: { orderId: string; type: string; description: string; photos?: File[] }) {
    const form = new FormData();
    form.append("type", type);
    form.append("description", description);
    (photos || []).forEach((p) => form.append("photos", p));
    const { data } = await api.post(`/carrier/orders/${orderId}/incidents`, form, {
      headers: {
        // ❌ KHÔNG set "Content-Type" để axios tự gắn boundary của FormData
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return data;
  },

  // ========= EVIDENCE (Before/After/Incident) =========
  async uploadEvidence({
    orderId, phase, files, notes,
  }: { orderId: string; phase: "BEFORE" | "AFTER" | "INCIDENT"; files: File[]; notes?: string; }) {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    if (notes) form.append("notes", notes);

    // BE mount /api; router path là /orders/:id/evidence
    const { data } = await api.post(
      `/orders/${orderId}/evidence`,
      form,
      {
        params: { phase }, // -> ?phase=BEFORE|AFTER|INCIDENT
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      }
    );
    return data as { ok: boolean; count: number; items: any[] };
  },

 async listEvidence(orderId: string, phase?: "BEFORE" | "AFTER" | "INCIDENT") {
    const { data } = await api.get(`/orders/${orderId}/evidence`, {
      params: phase ? { phase } : undefined,
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return data as { items: any[] };
  },
};
