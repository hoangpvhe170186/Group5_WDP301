"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, MapPin, Calendar, ArrowRight, Search, Filter } from "lucide-react";

interface OrdersListProps {
  onViewJob: (jobId: string) => void;
}

export function OrdersList({ onViewJob }: OrdersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const orders = [
    {
      id: "ORD-001",
      customer: "Công ty TNHH ABC",
      pickup: {
        address: "123 Đường Láng, Đống Đa, Hà Nội",
        time: "08:00 - 10:00, 15/12/2024",
      },
      delivery: {
        address: "456 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        time: "14:00 - 16:00, 16/12/2024",
      },
      goods: "Thiết bị điện tử",
      weight: "500 kg",
      status: "pending",
      statusText: "Chờ xác nhận",
      priority: "high",
    },
    {
      id: "ORD-002",
      customer: "Cửa hàng XYZ",
      pickup: {
        address: "789 Lê Duẩn, Hải Châu, Đà Nẵng",
        time: "09:00 - 11:00, 15/12/2024",
      },
      delivery: {
        address: "321 Trần Phú, TP. Huế",
        time: "15:00 - 17:00, 15/12/2024",
      },
      goods: "Hàng tiêu dùng",
      weight: "300 kg",
      status: "accepted",
      statusText: "Đã chấp nhận",
      priority: "medium",
    },
    {
      id: "ORD-003",
      customer: "Nhà máy DEF",
      pickup: {
        address: "555 Lạch Tray, Ngô Quyền, Hải Phòng",
        time: "07:00 - 09:00, 16/12/2024",
      },
      delivery: {
        address: "888 Hạ Long, Quảng Ninh",
        time: "12:00 - 14:00, 16/12/2024",
      },
      goods: "Nguyên liệu sản xuất",
      weight: "1200 kg",
      status: "pending",
      statusText: "Chờ xác nhận",
      priority: "high",
    },
    {
      id: "ORD-004",
      customer: "Siêu thị GHI",
      pickup: {
        address: "222 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
        time: "10:00 - 12:00, 15/12/2024",
      },
      delivery: {
        address: "333 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        time: "14:00 - 16:00, 15/12/2024",
      },
      goods: "Thực phẩm tươi sống",
      weight: "200 kg",
      status: "accepted",
      statusText: "Đã chấp nhận",
      priority: "low",
    },
  ]

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/20 text-destructive";
      case "medium":
        return "bg-warning/20 text-warning";
      case "low":
        return "bg-success/20 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/20 text-warning";
      case "accepted":
        return "bg-info/20 text-info";
      case "in-progress":
        return "bg-primary/20 text-primary";
      case "completed":
        return "bg-success/20 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Đơn hàng được giao
        </h2>
        <p className="text-muted-foreground">
          Quản lý và xem chi tiết các đơn hàng của bạn
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đơn hoặc khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="accepted">Đã chấp nhận</SelectItem>
                  <SelectItem value="in-progress">Đang vận chuyển</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card
            key={order.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardHeader className="bg-muted/30 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-2">{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {order.customer}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(order.priority)}>
                    {order.priority === "high"
                      ? "Ưu tiên cao"
                      : order.priority === "medium"
                      ? "Trung bình"
                      : "Thấp"}
                  </Badge>
                  <Badge className={getStatusColor(order.status)}>
                    {order.statusText}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Pickup Info */}
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                    <MapPin className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Điểm lấy hàng
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.pickup.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {order.pickup.time}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 pl-5">
                  <div className="h-8 w-0.5 bg-border" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Delivery Info */}
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <MapPin className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Điểm giao hàng
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {order.delivery.time}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Goods Info */}
                <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {order.goods}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Khối lượng: {order.weight}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => onViewJob(order.id)}
                  >
                    Xem chi tiết
                  </Button>
                  {order.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                      >
                        Chấp nhận
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              Không tìm thấy đơn hàng
            </p>
            <p className="text-sm text-muted-foreground">
              Thử thay đổi bộ lọc hoặc tìm kiếm khác
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}