"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Package,
  FileText,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Box,
  Feather,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem, JobStatus } from "@/types/carrier";

// =====================
// Types & helpers
// =====================
interface JobDetailsProps {
  readonly jobId: string | null;
  readonly onBack: () => void;
  readonly onUploadBefore: () => void;
  readonly onUploadAfter: () => void;
  readonly onReportIncident: () => void;
}

const statusText: Record<string, string> = {
  ASSIGNED: "Chờ xác nhận",
  ACCEPTED: "Đã chấp nhận",
  CONFIRMED: "Đã xác nhận hợp đồng",
  ON_THE_WAY: "Đang di chuyển",
  ARRIVED: "Đã tới nơi",
  DELIVERING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  DECLINED: "Từ chối",
  CANCELLED: "Đã huỷ",
  INCIDENT: "Sự cố",
  PAUSED: "Tạm dừng",
  NOTE: "Ghi chú",
};

const trackingOptions = [
  { value: "ON_THE_WAY", label: "Đang di chuyển" },
  { value: "ARRIVED", label: "Đã tới nơi" },
  { value: "DELIVERING", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "INCIDENT", label: "Đang gặp sự cố" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "NOTE_ONLY", label: "Chỉ lưu ghi chú" },
] as const;

const statusTone = (s: string) => {
  switch (s) {
    case "INCIDENT":
      return "bg-red-100 text-red-700 border-red-200";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "ON_THE_WAY":
    case "ARRIVED":
    case "DELIVERING":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// =====================
// Component
// =====================

export function JobDetails({
  jobId,
  onBack,
  onUploadBefore,
  onUploadAfter,
  onReportIncident,
}: JobDetailsProps) {
  const navigate = useNavigate(); // ✅ Giữ navigate từ main
  const [job, setJob] = useState<JobItem & { goods?: any[]; trackings?: any[] } | null>(null); // ✅ Giữ kiểu mở rộng từ quang

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [before, setBefore] = useState<any[]>([]);
  const [after, setAfter] = useState<any[]>([]);

  async function loadMedias() {
    if (!jobId) return;
    try {
      const [b, a] = await Promise.all([
        carrierApi.listEvidence(jobId, "BEFORE"),
        carrierApi.listEvidence(jobId, "AFTER"),
      ]);
      setBefore(b.items || []);
      setAfter(a.items || []);
    } catch (e) {
      console.error("load medias error:", e);
      setBefore([]); setAfter([]);
    }
  }

  // tracking modal
  const [openTrackModal, setOpenTrackModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("ON_THE_WAY");
  const [note, setNote] = useState<string>("");

  const isReadOnly = useMemo(
    () => (job?.status ? ["DECLINED", "CANCELLED"].includes(job.status) : false),
    [job?.status]
  );

  const load = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setErr(null);
      const d = await carrierApi.jobDetail(jobId);
      setJob(d);
    } catch (e: any) {
      console.error("job detail error:", e);
      setErr("Không thể tải chi tiết đơn hàng.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadMedias();
  }, [jobId]); // ⬅️ chỉ 1 effect là đủ

  // actions
  const advance = async (next: JobStatus) => {
    if (!job) return;
    await carrierApi.updateProgress(job.id, next);
    await load();
  };
  const accept = async () => { if (!job) return; await carrierApi.acceptJob(job.id); await load(); };
  const decline = async () => { if (!job) return; await carrierApi.declineJob(job.id); onBack(); };
  const confirmContract = async () => { if (!job) return; await carrierApi.confirmContract(job.id); await load(); };
  const confirmDelivery = async () => { if (!job) return; await carrierApi.confirmDelivery(job.id); await load(); };

  const decline = async () => {
    if (!job) return;
    const reason = window.prompt("Nhập lý do từ chối (không bắt buộc):") || undefined;
    await carrierApi.declineJob(job.id, reason);
    onBack();
  };

  const confirmContract = async () => {
    if (!job) return;
    await carrierApi.confirmContract(job.id);
    await load();
  };

  const confirmDelivery = async () => {
    if (!job) return;
    await carrierApi.confirmDelivery(job.id);
    await load();
  };

  const submitTracking = async () => {
    if (!job) return;

    const payloadStatus = nextStatus === "NOTE_ONLY" ? "NOTE" : nextStatus;
    try {
      await carrierApi.addTracking(job.id, payloadStatus, note || "");
      // refresh tracking only to be light
      const updated = await carrierApi.getTrackings(job.id);
      setJob((prev) => (prev ? { ...prev, trackings: updated } : prev));
      setOpenTrackModal(false);
      setNote("");
    } catch (e) {
      console.error("add tracking failed:", e);
      // fallback: hard reload
      await load();
      setOpenTrackModal(false);
    }
  };

  // ===================== Render guards =====================
  if (!jobId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Chưa chọn đơn hàng.</p>
          <Button variant="outline" className="mt-3 bg-transparent" onClick={onBack}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Đang tải chi tiết đơn hàng...
        </CardContent>
      </Card>
    );
  }

  if (err || !job) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">{err || "Không tìm thấy đơn hàng."}</p>
          <Button variant="outline" className="mt-3 bg-transparent" onClick={onBack}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ===================== UI =====================
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">Chi tiết đơn hàng</h2>
            <p className="text-muted-foreground">{job.orderCode}</p>
          </div>
          <Badge>{statusText[job.status] ?? job.status}</Badge>
        </div>

        {/* ✅ Giữ cảnh báo chỉ xem */}
{isReadOnly && (
  <Card className="border-yellow-300 bg-yellow-50">
    <CardContent className="p-4 flex items-start gap-3">
      <ShieldAlert className="h-5 w-5 text-yellow-700 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-900">
          Chế độ xem chi tiết (đơn đã {job.status === "DECLINED" ? "từ chối" : "huỷ"}). Mọi thao tác đã bị vô hiệu hoá.
        </p>
      </div>
    </CardContent>
  </Card>
)}

{/* ✅ Lộ trình — merge cả scheduledTime*/}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <MapPin className="h-5 w-5" /> Lộ trình
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="space-y-3">
      <div className="text-sm font-semibold">Điểm lấy</div>
      <div className="ml-1">
        <p className="text-sm">{job.pickup?.address || "—"}</p>
        {job.scheduledTime && (
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{job.scheduledTime}</span>
          </div>
        )}
      </div>
    </div>
    <div className="space-y-3">
      <div className="text-sm font-semibold">Điểm giao</div>
      <div className="ml-1">
        <p className="text-sm">{job.dropoff?.address || "—"}</p>
      </div>
    </div>
  </CardContent>
</Card>

{/* ✅ Gộp luôn phần Hàng Hoá + Ảnh trước/sau từ main */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Package className="h-5 w-5" /> Hàng hoá
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <p className="text-sm">{job.goodsSummary || "—"}</p>
  </CardContent>
</Card>

{/* ẢNH ĐỐI CHIẾU */}
<Card>
  <CardHeader><CardTitle>Ảnh đối chiếu</CardTitle></CardHeader>
  <CardContent className="space-y-6">
    <div>
      <div className="text-sm font-semibold mb-2">Trước khi lấy</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {before.map(m => (
          <a key={m._id} href={m.file_url} target="_blank" className="block">
            <img src={m.thumb_url || m.file_url} className="w-full rounded-lg border" />
          </a>
        ))}
      </div>
    </div>
    <div>
      <div className="text-sm font-semibold mb-2">Sau khi giao</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {after.map(m => (
          <a key={m._id} href={m.file_url} target="_blank" className="block">
            <img src={m.thumb_url || m.file_url} className="w-full rounded-lg border" />
          </a>
        ))}
      </div>
    </div>
    <Button
      variant="outline"
      className="gap-2 bg-transparent"
      onClick={() => navigate(`/carrier/compare/${job.id}`)}
    >
      <Camera className="h-4 w-4" /> Xem ảnh đối chiếu (trang riêng)
    </Button>
  </CardContent>
</Card>


        {/* Goods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Hàng hoá
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(job.goods) && job.goods.length > 0 ? (
              <div className="space-y-2">
                {job.goods.map((g: any) => (
                  <div
                    key={g.id || g._id}
                    className="flex justify-between items-center rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="font-medium">{g.description || "Chưa có mô tả"}</div>
                        <div className="text-xs text-muted-foreground">
                          SL: {g.quantity ?? 0} • Nặng: {(g.weight ?? 0).toString()} kg
                        </div>
                      </div>
                    </div>
                    {g.fragile ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        <Feather className="h-3 w-3" />
                        Dễ vỡ
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có mục hàng hoá.</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              {job.status === "ASSIGNED" && (
                <>
                  <Button className="gap-2" onClick={accept}>
                    <CheckCircle2 className="h-4 w-4" /> Chấp nhận
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={decline}>
                    Từ chối
                  </Button>
                </>
              )}

              {!isReadOnly && job.status === "ACCEPTED" && (
                <Button variant="outline" className="gap-2 bg-transparent" onClick={confirmContract}>
                  <FileText className="h-4 w-4" /> Xác nhận hợp đồng
                </Button>
              )}

              {!isReadOnly && (
                <>
                  <Button className="gap-2" onClick={onUploadBefore}>
                    <Camera className="h-4 w-4" /> Chụp trước khi lấy
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={onUploadAfter}>
                    <Camera className="h-4 w-4" /> Chụp sau khi giao
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={onReportIncident}>
                    <AlertTriangle className="h-4 w-4" /> Báo cáo sự cố
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => setOpenTrackModal(true)}
                  >
                    <Clock className="h-4 w-4" /> Cập nhật tiến độ
                  </Button>
                </>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Tracking Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử cập nhật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(job.trackings) && job.trackings.length > 0 ? (
              <div className="space-y-2">
                {job.trackings.map((t: any) => {
                  const tone = statusTone(t.status);
                  return (
                    <div
                      key={t.id || t._id || `${t.status}-${t.createdAt}`}
                      className={`flex items-start justify-between rounded-lg border p-3 ${tone}`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs opacity-70">
                          {new Date(t.createdAt).toLocaleString("vi-VN")}
                        </div>
                        <div className="text-sm font-semibold">
                          {statusText[t.status] ?? t.status}
                        </div>
                        {t.note ? (
                          <div className="text-sm">{t.note}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có cập nhật nào.</p>
            )}

      {/* ✅ Các nút hành động */}
<div className="flex gap-2">
  <Button className="gap-2" onClick={onUploadBefore}>
    <Camera className="h-4 w-4" /> Chụp trước khi lấy
  </Button>
  <Button variant="outline" className="gap-2 bg-transparent" onClick={onUploadAfter}>
    <Camera className="h-4 w-4" /> Chụp sau khi giao
  </Button>
  <Button variant="outline" className="gap-2 bg-transparent" onClick={onReportIncident}>
    <AlertTriangle className="h-4 w-4" /> Báo cáo sự cố
  </Button>
  <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setOpenTrackModal(true)}>
    <Clock className="h-4 w-4" /> Cập nhật tiến độ
  </Button>
</div>

{/* ✅ Modal cập nhật tiến độ – lấy từ quang */}
<Dialog open={openTrackModal} onOpenChange={setOpenTrackModal}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Cập nhật tiến độ</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Trạng thái</div>
        <Select value={nextStatus} onValueChange={setNextStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {trackingOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Mô tả / ghi chú</div>
        <Textarea
          placeholder="Mô tả ngắn gọn tình trạng / tiến độ (tuỳ chọn)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
      </div>
    </div>

    <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" onClick={() => setOpenTrackModal(false)}>Hủy</Button>
      <Button onClick={handleSubmitTracking}>Xác nhận</Button>
    </div>
  </DialogContent>
</Dialog>

          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenTrackModal(false)}>
              Huỷ
            </Button>
            <Button onClick={submitTracking}>Lưu cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
