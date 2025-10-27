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

// Gom nhóm trạng thái phục vụ thống kê
const GROUPS = {
  PENDING: ["PENDING", "ASSIGNED", "CONFIRMED", "AVAILABLE"],
  DELIVERING: ["DELIVERING", "ON_THE_WAY", "ARRIVED"],
  COMPLETED: ["COMPLETED", "DELIVERED"],
} as const;


const isIn = (status: string, list: readonly string[]) => list.includes(status);
const norm = (s?: string) => String(s ?? "").toUpperCase();
const getId = (o: Partial<JobItem> & { _id?: string }) =>
  String((o as any)?.id ?? o?._id ?? "");

const MAX_ALERT_ITEMS = 6;

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
            getId(o) === String(payload.orderId) ? { ...o, status: "ACCEPTED" } : o
          );
        }

        // Nếu người khác nhận → xoá khỏi danh sách pending/pool
        return prev.filter((o) => getId(o) !== String(payload.orderId));
      });
    };

    socket.on("order:claimed", handleClaim);
    return () => socket.off("order:claimed", handleClaim);
  }, []);

  // 📊 Thống kê realtime
  const stats = useMemo(() => {
    const pending = orders.filter((o) => isIn(norm(o.status), GROUPS.PENDING)).length;
    const delivering = orders.filter((o) => isIn(norm(o.status), GROUPS.DELIVERING)).length;
    const completed = orders.filter((o) => {
      const s = norm(o.status);
      return ["COMPLETED", "DELIVERED", "DELIVERING", "DONE", "FINISHED", "HOÀN TẤT"].includes(s);
    }).length;


    const total = orders.length;
    const rateNum = total ? Math.round((completed / total) * 100) : 0;
    return { pending, delivering, completed, rate: `${rateNum}%`, total };
  }, [orders]);

  // 🟡 Danh sách chi tiết các đơn chờ xử lý
  const pendingConfirmed = useMemo(
    () => orders.filter((o) => norm(o.status) === "CONFIRMED"),
    [orders]
  );
  const pendingAssigned = useMemo(
    () => orders.filter((o) => norm(o.status) === "ASSIGNED"),
    [orders]
  );

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
              <p className="text-xs text-muted-foreground mt-1">
                CONFIRMED, ASSIGNED
              </p>
            </div>
            <Package className="h-6 w-6 text-warning" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đang vận chuyển</p>
              <p className="text-3xl font-bold">{stats.delivering}</p>
              <p className="text-xs text-muted-foreground mt-1">
                DELIVERING, ON_THE_WAY
              </p>
            </div>
            <Truck className="h-6 w-6 text-info" />
          </CardContent>
        </Card>

       
      </div>

      {/* Alert section: hiển thị chi tiết CONFIRMED & ASSIGNED */}
      {(pendingConfirmed.length + pendingAssigned.length) > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CONFIRMED */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">CONFIRMED</Badge>
                  <span className="text-sm text-muted-foreground">
                    Đơn cần xử lý
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {pendingConfirmed.length}
                </span>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {pendingConfirmed.slice(0, MAX_ALERT_ITEMS).map((o) => {
                  const id = getId(o);
                  return (
                    <div
                      key={`confirmed-${id}`}
                      className="rounded-md border bg-card p-3 hover:bg-accent/50 cursor-pointer"
                      onClick={() => onSelectJob(id)}
                      title="Xem chi tiết đơn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{o.orderCode ?? id}</span>
                        <Badge>CONFIRMED</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {o.pickup?.address || "—"} → {o.dropoff?.address || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {pendingConfirmed.length > MAX_ALERT_ITEMS && (
                <p className="text-xs text-muted-foreground mt-2">
                  … và {pendingConfirmed.length - MAX_ALERT_ITEMS} đơn khác.
                </p>
              )}
            </div>

            {/* ASSIGNED */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">ASSIGNED</Badge>
                  <span className="text-sm text-muted-foreground">
                    Đơn mới được phân công
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {pendingAssigned.length}
                </span>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {pendingAssigned.slice(0, MAX_ALERT_ITEMS).map((o) => {
                  const id = getId(o);
                  return (
                    <div
                      key={`assigned-${id}`}
                      className="rounded-md border bg-card p-3 hover:bg-accent/50 cursor-pointer"
                      onClick={() => onSelectJob(id)}
                      title="Xem chi tiết đơn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{o.orderCode ?? id}</span>
                        <Badge>ASSIGNED</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {o.pickup?.address || "—"} → {o.dropoff?.address || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {pendingAssigned.length > MAX_ALERT_ITEMS && (
                <p className="text-xs text-muted-foreground mt-2">
                  … và {pendingAssigned.length - MAX_ALERT_ITEMS} đơn khác.
                </p>
              )}
            </div>

            {/* CTA xem tất cả */}
            <div className="pt-2">
              <Button variant="ghost" size="sm" className="gap-2" onClick={onViewOrders}>
                Xem tất cả đơn chờ xử lý <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
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
          {recentOrders.map((o) => {
            const id = getId(o);
            return (
              <div
                key={id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition cursor-pointer"
                onClick={() => onSelectJob(id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{o.orderCode ?? id}</span>
                  <Badge>{norm(o.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {o.pickup?.address || "—"} → {o.dropoff?.address || "—"}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
