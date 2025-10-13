"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, XCircle, Clock, Search, CalendarIcon, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem } from "@/types/carrier";

interface JobHistoryProps {
  onViewJob: (jobId: string) => void;
}

export function JobHistory({ onViewJob }: JobHistoryProps) {
  const [list, setList] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date>();

  // Mock data với cấu trúc phù hợp với JobItem
  const mockHistory: JobItem[] = [
    {
      id: "ORD-098",
      orderCode: "ORD-098",
      customerName: "Công ty TNHH XYZ",
      pickup: { address: "Hà Nội" },
      dropoff: { address: "Hải Phòng" },
      scheduledTime: "08:00 - 10:00, 14/12/2024",
      status: "COMPLETED",
      goodsSummary: "Thiết bị điện tử",
    },
    {
      id: "ORD-097",
      orderCode: "ORD-097",
      customerName: "Siêu thị ABC",
      pickup: { address: "Đà Nẵng" },
      dropoff: { address: "Huế" },
      scheduledTime: "09:00 - 11:00, 13/12/2024",
      status: "COMPLETED",
      goodsSummary: "Hàng tiêu dùng",
    },
    {
      id: "ORD-096",
      orderCode: "ORD-096",
      customerName: "Nhà máy DEF",
      pickup: { address: "TP.HCM" },
      dropoff: { address: "Bình Dương" },
      scheduledTime: "07:00 - 09:00, 12/12/2024",
      status: "COMPLETED",
      goodsSummary: "Nguyên liệu sản xuất",
    },
    {
      id: "ORD-095",
      orderCode: "ORD-095",
      customerName: "Cửa hàng GHI",
      pickup: { address: "Hà Nội" },
      dropoff: { address: "Ninh Bình" },
      scheduledTime: "10:00 - 12:00, 11/12/2024",
      status: "CANCELLED",
      goodsSummary: "Thực phẩm",
    },
    {
      id: "ORD-094",
      orderCode: "ORD-094",
      customerName: "Công ty JKL",
      pickup: { address: "Cần Thơ" },
      dropoff: { address: "Sóc Trăng" },
      scheduledTime: "08:00 - 10:00, 10/12/2024",
      status: "COMPLETED",
      goodsSummary: "Nông sản",
    },
  ];

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await carrierApi.listJobs({ status: "HISTORY" as any });
      // Nếu data là mảng và có phần tử, dùng data, ngược lại dùng mock data
      if (Array.isArray(data) && data.length > 0) {
        setList(data);
      } else {
        setList(mockHistory);
      }
    } catch (e) {
      console.error("history error:", e);
      // Fallback to mock data if API fails
      setList(mockHistory);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const filteredHistory = useMemo(() => {
    return list.filter((item) => {
      const matchesSearch =
        item.orderCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customerName ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && item.status === "COMPLETED") ||
        (statusFilter === "cancelled" && item.status === "CANCELLED");

      return matchesSearch && matchesStatus;
    });
  }, [list, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Lịch sử công việc</h2>
        <p className="text-muted-foreground">Xem lại các đơn hàng đã hoàn thành / huỷ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Hoàn thành</p><p className="text-2xl font-bold text-foreground mt-1">
            {list.filter((h) => h.status === "COMPLETED").length}
          </p></div><CheckCircle2 className="h-8 w-8 text-success" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Huỷ</p><p className="text-2xl font-bold text-foreground mt-1">
            {list.filter((h) => h.status === "CANCELLED").length}
          </p></div><XCircle className="h-8 w-8 text-destructive" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Tháng này</p><p className="text-2xl font-bold text-foreground mt-1">—</p></div><Clock className="h-8 w-8 text-info" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Tổng thu nhập</p><p className="text-xl font-bold text-primary mt-1">—</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm theo mã đơn / khách hàng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã huỷ</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (<Card><CardContent className="p-6 text-sm text-muted-foreground">Đang tải lịch sử...</CardContent></Card>)}

      <div className="space-y-3">
        {!isLoading && filteredHistory.length === 0 && (
          <Card><CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Không có lịch sử</p>
            <p className="text-sm text-muted-foreground">Chưa có đơn hoàn thành/huỷ</p>
          </CardContent></Card>
        )}

        {filteredHistory.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{item.orderCode}</h3>
                    <Badge className={item.status === "COMPLETED" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                      {item.status === "COMPLETED" ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                      {item.status === "COMPLETED" ? "Hoàn thành" : "Đã huỷ"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.customerName || "Khách hàng"}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-foreground">
                      {item.pickup?.address || "Điểm lấy"} → {item.dropoff?.address || "Điểm giao"}
                    </span>
                    {item.scheduledTime && (
                      <span className="text-muted-foreground">• {item.scheduledTime}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => onViewJob(item.id)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}