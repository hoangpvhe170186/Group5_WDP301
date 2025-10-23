"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem } from "@/types/carrier";
import { socket } from "@/lib/socket";

interface DashboardOverviewProps {
  onViewOrders: () => void;
  onSelectJob: (jobId: string) => void;
}

export function DashboardOverview({
  onViewOrders,
  onSelectJob,
}: DashboardOverviewProps) {
  const [orders, setOrders] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 📦 Load dữ liệu ban đầu
  const load = async () => {
    try {
      setLoading(true);
      const res = await carrierApi.listOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error("⚠️ Lỗi tải danh sách:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const userId = localStorage.getItem("user_id");
    socket.emit("join_room", "carrier:all");

    // Khi có carrier nhận đơn
    const handleClaim = (payload: any) => {
      console.log("📢 order:claimed (overview):", payload);

      setOrders((prev) => {
        if (!Array.isArray(prev)) return prev;

        // Nếu chính mình nhận đơn → đổi status thành ACCEPTED
        if (String(payload.carrierId) === String(userId)) {
          return prev.map((o) =>
            String(o.id) === String(payload.orderId)
              ? { ...o, status: "ACCEPTED" }
              : o
          );
        }

        // Nếu người khác nhận → xoá khỏi danh sách pending
        return prev.filter(
          (o) =>
            String(o.id) !== String(payload.orderId) &&
            String(o._id) !== String(payload.orderId)
        );
      });
    };

    socket.on("order:claimed", handleClaim);

    return () => {
      socket.off("order:claimed", handleClaim);
    };
  }, []);

  // 📊 Thống kê realtime
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "ASSIGNED").length;
    const delivering = orders.filter(
      (o) => o.status === "ACCEPTED" || o.status === "CONFIRMED"
    ).length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const rate = orders.length
      ? Math.round((completed / orders.length) * 100)
      : 0;
    return { pending, delivering, completed, rate: `${rate}%` };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  // 🧾 Render
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20">
        <h2 className="text-2xl font-bold">Chào mừng trở lại</h2>
        <p className="text-muted-foreground">
          Bạn có {stats.pending} đơn hàng mới cần xử lý
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Package className="h-6 w-6 text-warning" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đang vận chuyển</p>
              <p className="text-3xl font-bold">{stats.delivering}</p>
            </div>
            <Truck className="h-6 w-6 text-info" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tỷ lệ thành công</p>
              <p className="text-3xl font-bold">{stats.rate}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Alert section */}
      {orders.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Hiện có {stats.pending} đơn đang chờ xử lý.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Đơn hàng gần đây</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewOrders}
            className="gap-2"
          >
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          )}
          {!loading && recentOrders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Không có đơn gần đây
            </p>
          )}
          {recentOrders.map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition cursor-pointer"
              onClick={() => onSelectJob(o.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{o.orderCode}</span>
                <Badge>{o.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {o.pickup?.address || "—"} → {o.dropoff?.address || "—"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
