// src/pages/carrier/dashboard/job-details.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MapPin, Calendar, Package, FileText, Camera, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem, JobStatus } from "@/types/carrier";
import { Separator } from "@/components/ui/separator";

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
};

export function JobDetails({ jobId, onBack, onUploadBefore, onUploadAfter, onReportIncident }: JobDetailsProps) {
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
  }, [jobId]);

  const advance = async (next: JobStatus) => {
    if (!job) return;
    await carrierApi.updateProgress(job.id, next);
    await load();
  };

  const accept = async () => { if (!job) return; await carrierApi.acceptJob(job.id); await load(); };
  const decline = async () => { if (!job) return; await carrierApi.declineJob(job.id); onBack(); };
  const confirmContract = async () => { if (!job) return; await carrierApi.confirmContract(job.id); await load(); };
  const confirmDelivery = async () => { if (!job) return; await carrierApi.confirmDelivery(job.id); await load(); };

  if (!jobId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-4">Chưa chọn đơn hàng.</p>
          <Button variant="outline" className="bg-transparent" onClick={onBack}>Quay lại danh sách</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Đang tải chi tiết đơn hàng...</CardContent>
      </Card>
    );
  }

  if (err || !job) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">{err || "Không tìm thấy đơn hàng."}</p>
          <Button variant="outline" className="mt-3 bg-transparent" onClick={onBack}>Quay lại danh sách</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">Chi tiết đơn hàng</h2>
          <p className="text-muted-foreground">{job.orderCode}</p>
        </div>
        <Badge>{statusText[job.status] ?? job.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Lộ trình</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Hàng hoá</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{job.goodsSummary || "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Thao tác</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            {job.status === "ASSIGNED" && (
              <>
                <Button className="gap-2" onClick={accept}><CheckCircle2 className="h-4 w-4" /> Chấp nhận</Button>
                <Button variant="outline" className="gap-2 bg-transparent" onClick={decline}>Từ chối</Button>
              </>
            )}
            {job.status === "ACCEPTED" && (
              <Button variant="outline" className="gap-2 bg-transparent" onClick={confirmContract}>
                <FileText className="h-4 w-4" /> Xác nhận hợp đồng
              </Button>
            )}

            <Button className="gap-2" onClick={onUploadBefore}><Camera className="h-4 w-4" /> Chụp trước khi lấy</Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={onUploadAfter}><Camera className="h-4 w-4" /> Chụp sau khi giao</Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={onReportIncident}><AlertTriangle className="h-4 w-4" /> Báo cáo sự cố</Button>

            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => advance("ON_THE_WAY")}><Clock className="h-4 w-4" /> Cập nhật tiến độ</Button>
          </div>
          <Separator />
          <Button className="w-full gap-2 bg-success hover:bg-success/90 text-white" onClick={confirmDelivery}>
            <CheckCircle2 className="h-4 w-4" /> Xác nhận giao hàng thành công
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
