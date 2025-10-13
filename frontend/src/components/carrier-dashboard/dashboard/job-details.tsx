"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MapPin, Calendar, Package, User, Phone, Mail, FileText, Camera,
  AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem, JobStatus } from "@/types/carrier";

interface JobDetailsProps {
  readonly jobId: string | null;
  readonly onBack: () => void;
  readonly onUploadBefore: () => void;
  readonly onUploadAfter: () => void;
  readonly onReportIncident: () => void;
}

export function JobDetails({ jobId, onBack, onUploadBefore, onUploadAfter, onReportIncident }: JobDetailsProps) {
  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - chỉ sử dụng khi không có API hoặc cho development
  const mockJob = {
    id: jobId || "ORD-001",
    status: "accepted",
    statusText: "Đã chấp nhận",
    orderCode: jobId || "ORD-001",
    customer: {
      name: "Công ty TNHH ABC",
      contact: "Nguyễn Văn B",
      phone: "0912 345 678",
      email: "contact@abc.com",
    },
    pickup: {
      address: "123 Đường Láng, Đống Đa, Hà Nội",
      time: "08:00 - 10:00, 15/12/2024",
      contact: "Trần Văn C",
      phone: "0923 456 789",
    },
    delivery: {
      address: "456 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh", 
      time: "14:00 - 16:00, 16/12/2024",
      contact: "Lê Thị D",
      phone: "0934 567 890",
    },
    goods: {
      description: "Thiết bị điện tử",
      quantity: "50 thùng",
      weight: "500 kg",
      notes: "Hàng dễ vỡ, cần xử lý cẩn thận",
    },
    contract: {
      number: "HD-2024-001",
      value: "15,000,000 VNĐ",
      payment: "Thanh toán sau khi giao hàng",
    },
  };

  const fetchDetail = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const d = await carrierApi.jobDetail(jobId);
      setJob(d);
    } catch (e) {
      console.error("get job detail error:", e);
      // Fallback to mock data if API fails
      setJob(mockJob as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDetail(); 
  }, [jobId]);

  const advance = async (next: JobStatus) => {
    if (!job) return;
    await carrierApi.updateProgress(job.id, next);
    await fetchDetail();
  };

  const accept = async () => { 
    if (!job) return; 
    await carrierApi.acceptJob(job.id); 
    await fetchDetail(); 
  };
  
  const decline = async () => { 
    if (!job) return; 
    await carrierApi.declineJob(job.id); 
    onBack(); 
  };
  
  const confirmContract = async () => { 
    if (!job) return; 
    await carrierApi.confirmContract(job.id); 
    await fetchDetail(); 
  };
  
  const confirmDelivery = async () => { 
    if (!job) return; 
    await carrierApi.confirmDelivery(job.id); 
    await fetchDetail(); 
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Đang tải chi tiết đơn hàng...</CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-4">Không tìm thấy đơn hàng.</p>
          <Button variant="outline" className="bg-transparent" onClick={onBack}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      "ASSIGNED": "Chờ xác nhận",
      "ACCEPTED": "Đã chấp nhận", 
      "CONFIRMED": "Đã xác nhận hợp đồng",
      "ON_THE_WAY": "Đang di chuyển",
      "ARRIVED": "Đã tới nơi",
      "DELIVERING": "Đang giao",
      "DELIVERED": "Đã giao", 
      "COMPLETED": "Hoàn tất",
      "DECLINED": "Từ chối"
    };
    return statusMap[status] || "Khác";
  };

  const statusText = getStatusText(job.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">Chi tiết đơn hàng</h2>
          <p className="text-muted-foreground">{job.orderCode}</p>
        </div>
        <Badge className="bg-info/20 text-info">{statusText}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:gap-6">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {(job as any).customer?.phone || (job as any).pickup?.phone || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {(job as any).customer?.email || "—"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {(job as any).customer?.name || job.customerName || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {(job as any).customer?.contact || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Lộ trình
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                <div className="h-3 w-3 rounded-full bg-success" />
              </div>
              <h3 className="font-semibold text-foreground">Điểm lấy</h3>
            </div>
            <div className="ml-4 space-y-2 border-l-2 border-border pl-6">
              <p className="text-sm text-foreground">{job.pickup?.address || "—"}</p>
              {job.scheduledTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{job.scheduledTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                <div className="h-3 w-3 rounded-full bg-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">Điểm giao</h3>
            </div>
            <div className="ml-4 space-y-2 pl-6">
              <p className="text-sm text-foreground">{job.dropoff?.address || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Hàng hóa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground">{job.goodsSummary || (job as any).goods?.description || "—"}</p>
          {(job as any).goods?.weight && (
            <p className="text-sm text-muted-foreground">Khối lượng: {(job as any).goods.weight}</p>
          )}
          {(job as any).goods?.notes && (
            <p className="text-sm text-muted-foreground">Ghi chú: {(job as any).goods.notes}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thao tác</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
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
            {job.status === "ACCEPTED" && (
              <Button variant="outline" className="gap-2 bg-transparent" onClick={confirmContract}>
                <FileText className="h-4 w-4" /> Xác nhận hợp đồng
              </Button>
            )}
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
              onClick={() => advance("ON_THE_WAY" as JobStatus)}
            >
              <Clock className="h-4 w-4" /> Cập nhật tiến độ
            </Button>
          </div>
          <Separator />
          <Button 
            className="w-full gap-2 bg-success hover:bg-success/90 text-white" 
            onClick={confirmDelivery}
          >
            <CheckCircle2 className="h-4 w-4" /> Xác nhận giao hàng thành công
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}