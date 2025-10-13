import api from "../lib/axios";
import type {
  CarrierProfile,
  EvidenceUploadPayload,
  IncidentPayload,
  JobItem,
  JobStatus,
} from "../types/carrier";

export const carrierApi = {
  getProfile: async () => {
    const { data } = await api.get<CarrierProfile>("/carrier/me");
    return data;
  },
  updateProfile: async (payload: Partial<CarrierProfile>) => {
    const { data } = await api.put<CarrierProfile>("/carrier/me", payload);
    return data;
  },
  listJobs: async (params?: { status?: JobStatus | "ACTIVE" | "HISTORY" }) => {
    const { data } = await api.get<JobItem[]>("/carrier/orders", { params });
    return data;
  },
  jobDetail: async (orderId: string) => {
    const { data } = await api.get<JobItem>(`/carrier/orders/${orderId}`);
    return data;
  },
  acceptJob: async (orderId: string) => {
    const { data } = await api.post(`/carrier/orders/${orderId}/accept`);
    return data;
  },
  declineJob: async (orderId: string) => {
    const { data } = await api.post(`/carrier/orders/${orderId}/decline`);
    return data;
  },
  confirmContract: async (orderId: string) => {
    const { data } = await api.post(`/carrier/orders/${orderId}/confirm-contract`);
    return data;
  },
  updateProgress: async (orderId: string, status: JobStatus) => {
    const { data } = await api.post(`/carrier/orders/${orderId}/progress`, { status });
    return data;
  },
  uploadEvidence: async ({ orderId, phase, files }: EvidenceUploadPayload) => {
    const form = new FormData();
    form.append("phase", phase);
    files.forEach((f) => form.append("files", f));
    const { data } = await api.post(`/carrier/orders/${orderId}/evidence`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  reportIncident: async ({ orderId, type, description, photos }: IncidentPayload) => {
    const form = new FormData();
    form.append("type", type);
    form.append("description", description);
    photos?.forEach((p) => form.append("photos", p));
    const { data } = await api.post(`/carrier/orders/${orderId}/incidents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  confirmDelivery: async (orderId: string, signatureUrl?: string) => {
    const { data } = await api.post(`/carrier/orders/${orderId}/confirm-delivery`, { signatureUrl });
    return data;
  },
};
