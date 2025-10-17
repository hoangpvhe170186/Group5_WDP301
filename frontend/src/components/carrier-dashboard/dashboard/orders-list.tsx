// src/pages/carrier/dashboard/orders-list.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, MapPin, Calendar, ArrowRight, Search, Filter, RefreshCw } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { JobItem } from "@/types/carrier";

interface OrdersListProps {
  onViewJob: (jobId: string) => void;
}

const statusLabel: Record<string, string> = {
  ASSIGNED: "Chờ xác nhận",
  ACCEPTED: "Đã chấp nhận",
  CONFIRMED: "Đã xác nhận",
  ON_THE_WAY: "Đang di chuyển",
  ARRIVED: "Đã tới nơi",
  DELIVERING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  DECLINED: "Từ chối",
  CANCELLED: "Đã huỷ",
};

const statusClass = (s: string) => {
  switch (s) {
    case "ASSIGNED":
      return "bg-yellow-100 text-yellow-800";
    case "ACCEPTED":
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "ON_THE_WAY":
    case "ARRIVED":
    case "DELIVERING":
      return "bg-primary/15 text-primary";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "DECLINED":
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function OrdersList({ onViewJob }: OrdersListProps) {
  const [orders, setOrders] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await carrierApi.listOrders();
      setOrders(res.orders || []);
    } catch (e: any) {
      console.error("Load orders error:", e);
      setError("Không thể tải danh sách đơn hàng từ server.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const okSearch =
        o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName || "").toLowerCase().includes(search.toLowerCase());
      const okStatus = filter === "all" ? true : o.status.toLowerCase() === filter;
      return okSearch && okStatus;
    });
  }, [orders, search, filter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Đang tải đơn hàng...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Đơn hàng được giao</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý và xem chi tiết các đơn hàng bạn được phân công
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã đơn / khách hàng..."
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="assigned">Chờ xác nhận</SelectItem>
                <SelectItem value="accepted">Đã chấp nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="on_the_way">Đang di chuyển</SelectItem>
                <SelectItem value="delivering">Đang giao</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã huỷ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Không có đơn hàng nào phù hợp.
          </CardContent>
        </Card>
      ) : (
        filtered.map((o) => (
          <Card key={o.id} className="hover:shadow-md transition">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{o.orderCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {o.customerName || "Khách hàng"}
                  </div>
                </div>
                <Badge className={statusClass(o.status)}>{statusLabel[o.status] ?? o.status}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                    <MapPin className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Điểm lấy hàng</div>
                    <div className="text-sm text-muted-foreground">{o.pickup?.address || "—"}</div>
                    {o.scheduledTime && (
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{o.scheduledTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-5">
                  <div className="h-8 w-0.5 bg-border" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <MapPin className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Điểm giao hàng</div>
                    <div className="text-sm text-muted-foreground">{o.dropoff?.address || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {o.status === "ASSIGNED" && (
                  <>
                    <Button onClick={() => onViewJob(o.id)}>Xem chi tiết</Button>
                    <Button variant="outline" onClick={async () => { await carrierApi.acceptJob(o.id); fetchOrders(); }}>
                      Chấp nhận
                    </Button>
                    <Button variant="outline" onClick={async () => { await carrierApi.declineJob(o.id); fetchOrders(); }}>
                      Từ chối
                    </Button>
                  </>
                )}
                {o.status !== "ASSIGNED" && (
                  <Button onClick={() => onViewJob(o.id)} className="col-span-1 sm:col-span-3">
                    Xem chi tiết
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
