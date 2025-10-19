// src/pages/carrier/dashboard/Overview.tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Clock, CheckCircle2, ArrowRight, Truck, AlertTriangle } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem } from "@/types/carrier";

interface DashboardOverviewProps {
  onViewOrders: () => void;
  onSelectJob: (jobId: string) => void;
}

export function DashboardOverview({ onViewOrders, onSelectJob }: DashboardOverviewProps) {
  const [orders, setOrders] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await carrierApi.listOrders();
      setOrders(res.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "ASSIGNED").length;
    const delivering = orders.filter((o) => ["ON_THE_WAY", "DELIVERING", "ARRIVED"].includes(o.status)).length;
    const completedThisMonth = orders.filter((o) => o.status === "COMPLETED").length; // đơn giản hoá
    const rate = orders.length ? Math.round((completedThisMonth / orders.length) * 100) : 0;
    return {
      pending, delivering, completedThisMonth, rate: `${rate}%`,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20">
        <h2 className="text-2xl font-bold">Chào mừng trở lại</h2>
        <p className="text-muted-foreground">Bạn có {stats.pending} đơn hàng mới cần xử lý</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Đơn hàng đang chờ</p><p className="text-3xl font-bold">{stats.pending}</p></div><Package className="h-6 w-6 text-warning" /></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Đang vận chuyển</p><p className="text-3xl font-bold">{stats.delivering}</p></div><Truck className="h-6 w-6 text-info" /></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Hoàn thành tháng này</p><p className="text-3xl font-bold">{stats.completedThisMonth}</p></div><CheckCircle2 className="h-6 w-6 text-success" /></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p><p className="text-3xl font-bold">{stats.rate}</p></div><TrendingUp className="h-6 w-6 text-primary" /></CardContent></Card>
      </div>

      {orders.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-card p-3 border border-border">
              <div className="flex-1">
                <p className="text-sm">Có {stats.pending} đơn hàng đang chờ bạn xác nhận.</p>
                <p className="text-xs text-muted-foreground">Cập nhật gần đây: {new Date().toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Đơn hàng gần đây</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewOrders} className="gap-2">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
            {!loading && recentOrders.length === 0 && <p className="text-sm text-muted-foreground">Không có đơn gần đây</p>}
            {recentOrders.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition cursor-pointer" onClick={() => onSelectJob(o.id)}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{o.orderCode}</span>
                  <Badge>{o.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{o.pickup?.address || "—"} → {o.dropoff?.address || "—"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
