"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Truck,
  AlertTriangle,
} from "lucide-react";

interface DashboardOverviewProps {
  onViewOrders: () => void;
  onSelectJob: (jobId: string) => void;
}

export function DashboardOverview({
  onViewOrders,
  onSelectJob,
}: DashboardOverviewProps) {
  const stats = [
    {
      title: "Đơn hàng đang chờ",
      value: "5",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Đang vận chuyển",
      value: "3",
      icon: Truck,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Hoàn thành tháng này",
      value: "24",
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: "96%",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "Công ty TNHH ABC",
      pickup: "Hà Nội",
      delivery: "TP. Hồ Chí Minh",
      status: "pending",
      statusText: "Chờ xác nhận",
      time: "2 giờ trước",
    },
    {
      id: "ORD-002",
      customer: "Cửa hàng XYZ",
      pickup: "Đà Nẵng",
      delivery: "Huế",
      status: "in-progress",
      statusText: "Đang vận chuyển",
      time: "5 giờ trước",
    },
    {
      id: "ORD-003",
      customer: "Nhà máy DEF",
      pickup: "Hải Phòng",
      delivery: "Quảng Ninh",
      status: "pending",
      statusText: "Chờ xác nhận",
      time: "1 ngày trước",
    },
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      message: "Đơn hàng ORD-001 cần xác nhận trước 18:00 hôm nay",
      time: "30 phút trước",
    },
    {
      id: 2,
      type: "info",
      message: "Cập nhật giấy phép lái xe sẽ hết hạn trong 15 ngày",
      time: "2 giờ trước",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Chào mừng trở lại, Nguyễn Văn A
        </h2>
        <p className="text-muted-foreground">
          Bạn có 5 đơn hàng mới cần xử lý hôm nay
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}
                  >
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Thông báo quan trọng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg bg-card p-3 border border-border"
              >
                <div className="flex-1">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Đơn hàng gần đây</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewOrders}
            className="gap-2"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onSelectJob(order.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {order.id}
                      </span>
                      <Badge
                        variant={
                          order.status === "in-progress"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          order.status === "in-progress"
                            ? "bg-info text-info-foreground"
                            : "bg-warning/20 text-warning"
                        }
                      >
                        {order.statusText}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customer}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground">{order.pickup}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{order.delivery}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 bg-transparent"
              onClick={onViewOrders}
            >
              <Package className="h-6 w-6 text-primary" />
              <span className="font-medium">Xem đơn hàng mới</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 bg-transparent"
            >
              <Clock className="h-6 w-6 text-info" />
              <span className="font-medium">Cập nhật tiến độ</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}