export type JobStatus =
  | "ASSIGNED" | "ACCEPTED" | "CONFIRMED"
  | "ON_THE_WAY" | "ARRIVED" | "DELIVERING"
  | "DELIVERED" | "COMPLETED" | "DECLINED" | "CANCELLED";

export interface AddressPoint {
  address: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
  window?: string; // time window text
}

export interface JobItem {
  id: string;
  orderCode: string;
  customerName?: string;
  pickup: AddressPoint;
  dropoff: AddressPoint;
  goodsSummary?: string;
  scheduledTime?: string;
  estimatePrice?: number;
  status: JobStatus;
}

export interface CarrierProfile {
  id: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  licenseNumber?: string;
  vehiclePlate?: string;
  documents: Array<{ name?: string; url?: string; type?: string }>;
}

export type EvidencePhase = "BEFORE" | "AFTER";

export interface EvidenceUploadPayload {
  orderId: string;
  phase: EvidencePhase;
  files: File[];
}

export interface IncidentPayload {
  orderId: string;
  type: string;
  description: string;
  photos?: File[];
}
