"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Package,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Box,
  Feather,
  QrCode,
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
import type { JobItem } from "@/types/carrier";
import { API_URL } from "@/config/api";

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
  { value: "INCIDENT", label: "Đang gặp sự cố" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "NOTE_ONLY", label: "Chỉ lưu ghi chú" },
  { value: "DELIVERED", label: "Đã giao" },

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
    case "DELIVERING":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export function JobDetails({
  jobId,
  onBack,
  onUploadBefore,
  onUploadAfter,
  onReportIncident,
}: JobDetailsProps) {
  const navigate = useNavigate();
  const [job, setJob] = useState<(JobItem & { goods?: any[]; trackings?: any[]; assignedCarrier?: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [before, setBefore] = useState<any[]>([]);
  const [after, setAfter] = useState<any[]>([]);

  const [openTrackModal, setOpenTrackModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("ON_THE_WAY");
  const [note, setNote] = useState<string>("");
  const [debtStatus, setDebtStatus] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [debtLoading, setDebtLoading] = useState(false);
  const debtStatusRef = useRef<string | null>(null);
  const autoConfirmRef = useRef(false);

  const isReadOnly = useMemo(
    () => (job?.status ? ["DECLINED", "CANCELLED"].includes(job.status) : false),
    [job?.status]
  );

  // ===================== LOAD DATA =====================
  const load = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setErr(null);
      const d = await carrierApi.jobDetail(jobId);
      setJob(d);
    } catch {
      setErr("Không thể tải chi tiết đơn hàng.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const loadMedias = useCallback(async () => {
    if (!jobId) return;
    try {
      const beforeData = await carrierApi.listEvidence(jobId, "BEFORE");
      const afterData = await carrierApi.listEvidence(jobId, "AFTER");
      setBefore(beforeData);
      setAfter(afterData);
    } catch {
      console.warn("⚠ Không có evidences");
      setBefore([]);
      setAfter([]);
    }
  }, [jobId]);

  useEffect(() => {
    load();
    loadMedias();
  }, [load, loadMedias]);

  const fetchDebtStatus = useCallback(async () => {
    if (!job || job.status !== "DELIVERED") {
      setDebtStatus(null);
      debtStatusRef.current = null;
      return;
    }
    try {
      setDebtLoading(true);
      const debt = await carrierApi.getDebt(job.id);
      setDebtStatus(debt.status);
      debtStatusRef.current = debt.status;
    } catch (error) {
      console.warn("Không thể tải trạng thái thanh toán", error);
    } finally {
      setDebtLoading(false);
    }
  }, [job]);

  useEffect(() => {
    fetchDebtStatus();
  }, [fetchDebtStatus]);

  useEffect(() => {
    if (!job || job.status !== "DELIVERED") return;
    const handleFocus = () => {
      if (debtStatusRef.current !== "PAID") {
        fetchDebtStatus();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [job?.status, job?.id, fetchDebtStatus]);

  // ===================== ACTIONS =====================
  const accept = async () => {
    if (!job) return;
    try {
      if (job.status === "ASSIGNED") {
        await carrierApi.acceptAssignedOrder(job.id);
      } else if (job.status === "CONFIRMED") {
        await carrierApi.acceptJob(job.id);
      }
      await load();
      alert("Đã chấp nhận đơn thành công!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể chấp nhận đơn này!");
    }
  };

  const decline = async () => {
    if (!job) return;
    const reason = window.prompt("Nhập lý do từ chối (không bắt buộc):") || undefined;
    try {
      if (job.status === "ASSIGNED") {
        await carrierApi.declineAssignedOrder(job.id);
      } else {
        await carrierApi.declineJob(job.id, reason);
      }
      alert("Đã từ chối đơn thành công!");
      onBack();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể từ chối đơn này!");
    }
  };


  const confirmDelivery = useCallback(async () => {
    if (!job?.id) return;
    try {
      await carrierApi.confirmDelivery(job.id);
      await load();
    } catch (error) {
      console.error("confirmDelivery failed", error);
    }
  }, [job?.id, load]);

  const openPayment = useCallback(async () => {
    if (!job?.id) return;
    try {
      setPayLoading(true);
      const debt = await carrierApi.getDebt(job.id);
      setDebtStatus(debt.status);
      debtStatusRef.current = debt.status;
      if (debt.status === "PAID") {
        alert(`Đã thanh toán hoa hồng cho ${debt.orderCode}`);
        return;
      }
      const created = await carrierApi.createCommissionPayment(job.id);
      if (created.payosLink) {
        window.open(created.payosLink, "_blank");
      } else if (created.qrCode) {
        alert("Không hỗ trợ hiển thị QR trực tiếp. Vui lòng mở PayOS.");
      } else {
        alert("Không thể tạo link thanh toán");
      }
    } catch (e) {
      alert("Không thể khởi tạo thanh toán. Thử lại sau.");
    } finally {
      setPayLoading(false);
    }
  }, [job?.id]);

  useEffect(() => {
    if (!job || job.status !== "DELIVERED") {
      autoConfirmRef.current = false;
      return;
    }
    if (debtStatus === "PAID" && !autoConfirmRef.current) {
      autoConfirmRef.current = true;
      confirmDelivery().catch(() => {
        autoConfirmRef.current = false;
      });
    }
  }, [job?.status, debtStatus, confirmDelivery]);

  const submitTracking = async () => {
    if (!job) return;
    const payloadStatus = nextStatus === "NOTE_ONLY" ? "NOTE" : nextStatus;
    try {
      await carrierApi.addTracking(job.id, payloadStatus, note || "");
      const updated = await carrierApi.getTrackings(job.id);
      setJob((prev) => {
        if (!prev) return prev;
        const newStatus = payloadStatus === "DELIVERED" ? "DELIVERED" : prev.status;
        return { ...prev, trackings: updated, status: newStatus };
      });
      setOpenTrackModal(false);
      setNote("");
    } catch (e) {
      console.error("add tracking failed:", e);
      await load();
      setOpenTrackModal(false);
    }
  };


  // ===================== RENDER STATES =====================
  if (!jobId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-4">Chưa chọn đơn hàng.</p>
          <Button variant="outline" onClick={onBack}>Quay lại danh sách</Button>
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
          <Button variant="outline" className="mt-3" onClick={onBack}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ===================== MAIN UI =====================
  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
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

        {/* ROUTE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Lộ trình
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="font-semibold">Điểm lấy</div>
              <p>{job.pickup?.address || "—"}</p>
            </div>
            <div>
              <div className="font-semibold">Điểm giao</div>
              <p>{job.dropoff?.address || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* GOODS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Hàng hoá
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(job.goods) && job.goods.length > 0 ? (
              job.goods.map((g) => (
                <div key={g.id || g._id} className="flex justify-between items-center rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{g.description || "Chưa có mô tả"}</div>
                      <div className="text-xs text-muted-foreground">
                        SL: {g.quantity ?? 0} • Nặng: {(g.weight ?? 0).toString()} kg
                      </div>
                    </div>
                  </div>
                  {g.fragile ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      <Feather className="h-3 w-3" /> Dễ vỡ
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Không có mục hàng hoá.</p>
            )}
          </CardContent>
        </Card>

        {/* EVIDENCE */}
        <Card>
          <CardHeader><CardTitle>Ảnh đối chiếu</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="font-semibold mb-2">Trước khi lấy</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {before.map((m) => (
                  <a
                    key={m.id || m._id}
                    href={`${API_URL}${m.url || m.file_url}`}
                    target="_blank"
                  >
                    <img
                      src={`${API_URL}${m.url || m.thumb_url || m.file_url}`}
                      crossOrigin="anonymous"
                      className="w-full rounded-lg border object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Sau khi giao</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {after.map((m) => (
                  <a
                    key={m.id || m._id}
                    href={`${API_URL}${m.url || m.file_url}`}
                    target="_blank"
                  >
                    <img
                      src={`${API_URL}${m.url || m.thumb_url || m.file_url}`}
                      crossOrigin="anonymous"
                      className="w-full rounded-lg border object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("lastViewedJobId", job.id);
                navigate(`/carrier/compare/${job.id}`);
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Xem ảnh đối chiếu (trang riêng)
            </Button>



          </CardContent>
        </Card>

        {/* ==== ACTIONS ==== */}
        <Card>
          <CardHeader><CardTitle>Thao tác</CardTitle></CardHeader>
          <CardContent className="space-y-3">

            {/* 1️⃣ Carrier có thể nhận đơn */}
            {job.status === "CONFIRMED" && !job.assignedCarrier && (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={async () => {
                  try {
                    await carrierApi.claimOrder(job.id);
                    await load();
                    alert("Đã nhận đơn thành công!");
                  } catch (err: any) {
                    alert(err.response?.data?.message || "Không thể nhận đơn này!");
                  }
                }}
              >
                🚚 Nhận đơn vận chuyển
              </Button>
            )}

            {/* 2️⃣ Carrier được chỉ định */}
            {!isReadOnly && job.status === "ASSIGNED" && (
              <div className="grid gap-2 md:grid-cols-2">
                <Button className="gap-2" onClick={accept}>
                  <CheckCircle2 className="h-4 w-4" /> Chấp nhận
                </Button>
                <Button variant="outline" onClick={decline}>
                  Từ chối
                </Button>
              </div>
            )}

            {/* 3️⃣ Sau khi chấp nhận (ACCEPTED) hoặc đang vận chuyển */}
            {!isReadOnly &&
              ["ACCEPTED", "ON_THE_WAY", "DELIVERING"].includes(job.status) && (
                <div className="space-y-2">
                  <Button onClick={onUploadBefore}>
                    <Camera className="h-4 w-4 mr-2" /> Chụp trước khi lấy hàng
                  </Button>
                  <Button variant="outline" onClick={onUploadAfter}>
                    <Camera className="h-4 w-4 mr-2" /> Chụp sau khi giao
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setOpenTrackModal(true)}
                    disabled={["DELIVERED", "COMPLETED"].includes(job.status)}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Cập nhật tiến độ
                  </Button>
                </div>
              )}

            {/* 4️⃣ Sau khi giao hàng */}
            {job.status === "DELIVERED" && (
              <div className="space-y-2 rounded-lg border border-dashed p-4">
                {debtStatus !== "PAID" ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Cần thanh toán hoa hồng để hoàn tất đơn hàng.
                    </p>
                    <Button
                      className="gap-2"
                      onClick={openPayment}
                      disabled={payLoading || debtLoading}
                    >
                      <QrCode className="h-4 w-4" />
                      {payLoading ? "Đang tạo mã..." : "Thanh toán hoa hồng"}
                    </Button>
                    {debtLoading && (
                      <p className="text-xs text-muted-foreground">
                        Đang kiểm tra trạng thái thanh toán...
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Đã thanh toán hoa hồng. Hệ thống sẽ tự xác nhận đơn.
                    </div>
                    <Button variant="outline" size="sm" onClick={confirmDelivery}>
                      Thử xác nhận lại thủ công
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!isReadOnly && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onReportIncident}
              >
                <AlertTriangle className="h-4 w-4 mr-2" /> Báo sự cố
              </Button>
            )}

            {/* 5️⃣ Trạng thái không thao tác */}
            {["DECLINED", "CANCELLED"].includes(job.status) && (
              <p className="text-sm text-muted-foreground">
                Đơn ở trạng thái {statusText[job.status]}. Không thể thao tác thêm.
              </p>
            )}

          </CardContent>
        </Card>

        {/* TRACKING TIMELINE */}
        <Card>
          <CardHeader><CardTitle>Lịch sử cập nhật</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(job.trackings) && job.trackings.length > 0 ? (
              job.trackings.map((t) => {
                const tone = statusTone(t.status);
                return (
                  <div
                    key={t._id || t.id}
                    className={`flex items-start justify-between rounded-lg border p-3 ${tone}`}
                  >
                    <div>
                      <div className="text-xs opacity-70">
                        {new Date(t.createdAt).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-sm font-semibold">
                        {statusText[t.status] ?? t.status}
                      </div>
                      {t.note && <div className="text-sm">{t.note}</div>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có cập nhật nào.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TRACKING MODAL */}
      <Dialog open={openTrackModal} onOpenChange={setOpenTrackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật tiến độ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Trạng thái</div>
              <Select value={nextStatus} onValueChange={setNextStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {trackingOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={
                        // 🚫 Disable “Đã giao” nếu đơn đã giao hoặc hoàn tất
                        (opt.value === "DELIVERED" &&
                          ["DELIVERED", "COMPLETED"].includes(job.status))
                      }
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>

              </Select>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Mô tả / ghi chú</div>
              <Textarea
                placeholder="Mô tả ngắn gọn tình trạng / tiến độ (tuỳ chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </div>
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
