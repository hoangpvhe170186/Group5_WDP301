// ✅ FULL FILE carrier.service.ts - ĐÃ TỐI ƯU HÓA
import api from "@/lib/axios";
import type { CarrierProfile, JobItem, JobStatus } from "@/types/carrier";

export type TrackingItem = {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
};

const normalizeStatus = (
  s?: string
): JobStatus | "ASSIGNED" | "DECLINED" | "CANCELLED" => {
  const raw = (s || "").toUpperCase();
  const map: Record<
    string,
    JobStatus | "ASSIGNED" | "DECLINED" | "CANCELLED"
  > = {
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
    INCIDENT: "DELIVERING",
    PAUSED: "DELIVERING",
  };
  return map[raw] ?? ("ASSIGNED" as const);
};

const toNum = (v: any) =>
  v?.$numberDecimal
    ? Number(v.$numberDecimal)
    : typeof v === "object" && v?._bsontype === "Decimal128"
      ? Number(v.toString())
      : Number(v ?? 0);

export const carrierApi = {
  async getProfile(): Promise<CarrierProfile> {
    const { data } = await api.get("/carrier/profile");
    return data;
  },

  async updateProfile(payload: Partial<CarrierProfile>): Promise<CarrierProfile> {
    const { data } = await api.put("/carrier/profile", payload);
    return data;
  },

  async listOrders(): Promise<{ orders: JobItem[] }> {
    const { data } = await api.get("/carrier/orders");

    const rawOrders = Array.isArray(data) ? data : data?.orders || [];

    const orders: JobItem[] = rawOrders.map((o: any) => ({
      id: String(o.id ?? o._id),
      orderCode: o.orderCode ?? `ORD-${String(o._id).slice(-6).toUpperCase()}`,
      customerName: o.customer?.name || o.customer?.full_name || "",
      pickup: { address: o.pickup_address || "" },
      dropoff: { address: o.delivery_address || "" },
      goodsSummary: o.goodsSummary || "",
      scheduledTime: o.scheduled_time
        ? new Date(o.scheduled_time).toLocaleString("vi-VN")
        : "",
      estimatePrice: o.total_price ?? 0,
      status: normalizeStatus(o.status),
    }));

    return { orders };
  },

  async listHistory(): Promise<JobItem[]> {
    const { data } = await api.get("/carrier/orders", {
      params: { include: "all" },
    });

    const rawOrders = Array.isArray(data) ? data : data?.orders || [];

    return rawOrders
      .map((o: any) => ({
        id: String(o.id ?? o._id),
        orderCode: o.orderCode ?? `ORD-${String(o._id).slice(-6).toUpperCase()}`,
        customerName: o.customer?.name || o.customer?.full_name || "",
        pickup: { address: o.pickup_address || "" },
        dropoff: { address: o.delivery_address || "" },
        goodsSummary: o.goodsSummary || "",
        scheduledTime: o.scheduled_time
          ? new Date(o.scheduled_time).toLocaleString("vi-VN")
          : "",
        estimatePrice: o.total_price ?? 0,
        status: normalizeStatus(o.status),
      }))
      .filter((o) =>
        ["COMPLETED", "CANCELLED", "DECLINED"].includes(o.status)
      );
  },

  async getDebt(orderId: string): Promise<{ status: string; commissionAmount: number; orderCode: string }> {
    const { data } = await api.get(`/carrier/orders/${orderId}/debt`);
    return data?.debt ?? { status: "PENDING", commissionAmount: 0, orderCode: "" };
  },

  async createCommissionPayment(orderId: string): Promise<{ paymentId: string; amount: number; description: string; qrCode?: string | null; payosLink?: string | null; }> {
    const { data } = await api.post(`/carrier/orders/${orderId}/payment/create`, {});
    return data;
  },

  async getCommissionPayments(orderId: string): Promise<Array<{ id: string; amount: number; status: string; description: string; createdAt: string; paidAt?: string }>> {
    const { data } = await api.get(`/carrier/payments`, {
      params: { orderId },
    });
    return data?.payments ?? [];
  },

  async jobDetail(orderId: string): Promise<any> {
    const { data } = await api.get(`/carrier/orders/${orderId}`);

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
      orderCode:
        data.orderCode ??
        `ORD-${String(data._id).slice(-6).toUpperCase()}`,
      pickup: { address: data.pickup_address },
      dropoff: { address: data.delivery_address },
      goodsSummary: data.goodsSummary || "",
      status: normalizeStatus(data.status),
      goods,
      trackings,
    };
  },

  async claimOrder(orderId: string) {
    const { data } = await api.post(`/carrier/orders/${orderId}/claim`, {});
    return data;
  },

  async acceptAssignedOrder(orderId: string) {
    const { data } = await api.post(`/carrier/orders/${orderId}/accept-assigned`, {});
    return data;
  },

  async declineAssignedOrder(orderId: string) {
    const { data } = await api.post(`/carrier/orders/${orderId}/decline-assigned`, {});
    return data;
  },

  async acceptJob(orderId: string) {
    const { data } = await api.post(`/carrier/claim/${orderId}`, {});
    return data;
  },

  async declineJob(orderId: string, reason?: string) {
    const { data } = await api.post(`/carrier/decline/${orderId}`, { reason });
    return data;
  },

  async listEvidence(orderId: string, phase?: "BEFORE" | "AFTER"): Promise<Array<{ id: string; url: string; type: "IMAGE" | "VIDEO"; phase: "BEFORE" | "AFTER"; uploadedAt: string; }>> {
    try {
      const { data } = await api.get(`/carrier/orders/${orderId}/evidence`, {
        params: phase ? { phase } : {},
      });
      return data?.items ?? [];
    } catch (e: any) {
      if (e?.response?.status === 404) {
        return [];
      }
      throw e;
    }
  },

  async uploadEvidence({
    orderId,
    files,
    phase,
  }: {
    orderId: string;
    phase: string;
    files: File[];
  }) {
    const form = new FormData();
    form.append("phase", phase);
    files.forEach((f) => form.append("files", f));

    const { data } = await api.post(
      `/carrier/orders/${orderId}/evidence`,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data;
  },

  async confirmContract(orderId: string) {
    const { data } = await api.post(`/carrier/orders/${orderId}/confirm-contract`, {});
    return data;
  },

  async updateProgress(orderId: string, status: JobStatus, note?: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/progress`,
      { status, note }
    );
    return data;
  },

  async confirmDelivery(orderId: string, signatureUrl?: string) {
    const { data } = await api.post(
      `/carrier/orders/${orderId}/confirm-delivery`,
      { signatureUrl }
    );
    return data;
  },

  async addTracking(orderId: string, status: string, note?: string) {
    const { data } = await api.post(
      `/order-tracking/${orderId}`,
      { status, note }
    );
    return data;
  },

  async getTrackings(orderId: string): Promise<TrackingItem[]> {
    const { data } = await api.get(`/order-tracking/${orderId}`);
    const list = data?.trackings || [];
    return list.map((t: any) => ({
      id: String(t._id),
      status: t.status,
      note: t.note || "",
      createdAt: t.createdAt,
    }));
  },

  async uploadAvatar(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const { data } = await api.post("/upload/avatar", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (data?.url) return data.url;
    throw new Error("Upload lại");
  },

  async reportIncident({
    orderId,
    type,
    description,
    photos,
  }: {
    orderId: string;
    type: string;
    description: string;
    photos?: File[];
  }) {
    const form = new FormData();
    form.append("type", type);
    form.append("description", description);
    (photos || []).forEach((p) => form.append("photos", p));
    
    const { data } = await api.post(
      `/carrier/orders/${orderId}/incidents`,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },
};