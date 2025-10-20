// src/pages/carrier/dashboard/job-history.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Search, Eye, Download, RefreshCw, Ban } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem } from "@/types/carrier";

interface JobHistoryProps {
  onViewJob: (jobId: string) => void;
}

export function JobHistory({ onViewJob }: JobHistoryProps) {
  const [list, setList] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const refresh = async () => {
    try {
      setLoading(true);
      const hist = await carrierApi.listHistory(); // gồm COMPLETED/CANCELLED/DECLINED
      setList(hist);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return list.filter((i) => {
      const okQ =
        i.orderCode?.toLowerCase().includes(q.toLowerCase()) ||
        (i.customerName || "").toLowerCase().includes(q.toLowerCase());
      const okStatus =
        filter === "all" ||
        (filter === "completed" && i.status === "COMPLETED") ||
        (filter === "cancelled" && i.status === "CANCELLED") ||
        (filter === "declined" && i.status === "DECLINED");
      return okQ && okStatus;
    });
  }, [list, q, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lịch sử công việc</h2>
          <p className="text-muted-foreground">Đơn hàng đã hoàn thành / huỷ / từ chối</p>
        </div>
        <Button variant="outline" onClick={refresh} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm mã đơn / khách hàng..."
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã huỷ</SelectItem>
                <SelectItem value="declined">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Đang tải lịch sử...</CardContent>
        </Card>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Không có lịch sử</p>
            <p className="text-sm text-muted-foreground">Chưa có đơn hoàn thành/huỷ/từ chối</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((i) => (
          <Card key={i.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{i.orderCode}</h3>

                    {/* Badge theo trạng thái */}
                    {i.status === "COMPLETED" ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Hoàn thành
                      </Badge>
                    ) : i.status === "CANCELLED" ? (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Đã huỷ
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Ban className="h-3 w-3 mr-1" />
                        Đã từ chối
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{i.customerName || "Khách hàng"}</p>
                  <div className="text-sm">
                    {i.pickup?.address || "—"} → {i.dropoff?.address || "—"}
                  </div>
                  {i.scheduledTime && <div className="text-xs text-muted-foreground">• {i.scheduledTime}</div>}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => onViewJob(i.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
