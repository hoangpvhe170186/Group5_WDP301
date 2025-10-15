"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, FileText, Camera, CheckCircle2 } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { CarrierProfile } from "@/types/carrier";

// Định nghĩa type cho document
interface Document {
  name?: string;
  url?: string;
  type?: string;
  expiry?: string;
  status?: "verified" | "pending" | "rejected";
}

// Type cho profile data (kết hợp API và mock)
interface ProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  avatarUrl?: string;
  documents?: Document[];
}

export function ProfileManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for development
  const mockProfile: ProfileData = {
    fullName: "Nguyễn Văn A",
    phone: "0912 345 678",
    email: "nguyenvana@email.com",
    address: "123 Đường ABC, Quận XYZ, Hà Nội",
    licenseNumber: "B2-123456789",
    vehiclePlate: "30A-12345",
    vehicleType: "Xe tải 5 tấn",
    avatarUrl: "/placeholder.svg",
    documents: [
      { name: "Giấy phép lái xe", status: "verified", expiry: "15/06/2026", type: "license", url: "#" },
      { name: "Đăng ký xe", status: "verified", expiry: "20/12/2025", type: "registration", url: "#" },
      { name: "Bảo hiểm xe", status: "verified", expiry: "10/03/2025", type: "insurance", url: "#" },
      { name: "Giấy khám sức khỏe", status: "pending", expiry: "05/01/2025", type: "health", url: "#" },
    ]
  };

  const load = async () => {
    try {
      setIsLoading(true);
      const p = await carrierApi.getProfile();
      console.log("API profile data:", p); // Debug log
      
      // Nếu API trả về dữ liệu, sử dụng nó, ngược lại dùng mock data
      if (p) {
        setProfile(p as ProfileData);
      } else {
        console.log("Using mock data for profile");
        setProfile(mockProfile);
      }
    } catch (e) {
      console.error("get profile error:", e);
      console.log("Using mock data due to error");
      setProfile(mockProfile);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await carrierApi.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        licenseNumber: profile.licenseNumber,
        vehiclePlate: profile.vehiclePlate,
      });
      setProfile(updated as ProfileData);
      setIsEditing(false);
    } catch (e) {
      console.error("update profile error:", e);
      alert("Cập nhật lỗi");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function để lấy status text
  const getStatusText = (status?: string) => {
    switch (status) {
      case "verified":
        return "Đã xác thực";
      case "pending":
        return "Chờ xác thực";
      default:
        return "Chưa xác thực";
    }
  };

  // Helper function để lấy status badge class
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "verified":
        return "bg-success/20 text-success";
      case "pending":
        return "bg-warning/20 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Đang tải hồ sơ...
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Không thể tải hồ sơ. Vui lòng thử lại.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Hồ sơ cá nhân</h2>
          <p className="text-muted-foreground">Quản lý thông tin và giấy tờ của bạn</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl ?? "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">
                  {profile.fullName?.split(" ").pop()?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="icon" 
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full" 
                  variant="secondary"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{profile.fullName}</h3>
              <p className="text-sm text-muted-foreground">{profile.phone ?? ""}</p>
              <p className="text-sm text-muted-foreground">{profile.email ?? ""}</p>
              <Badge className="mt-2 bg-success/20 text-success">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Đã xác thực
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input 
                id="name" 
                value={profile.fullName ?? ""} 
                disabled={!isEditing} 
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone" 
                value={profile.phone ?? ""} 
                disabled={!isEditing} 
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">Số GPLX</Label>
              <Input 
                id="license" 
                value={profile.licenseNumber ?? ""} 
                disabled={!isEditing} 
                onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Biển số xe</Label>
              <Input 
                id="plate" 
                value={profile.vehiclePlate ?? ""} 
                disabled={!isEditing} 
                onChange={(e) => setProfile({ ...profile, vehiclePlate: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Địa chỉ</Label>
            <Textarea 
              disabled 
              rows={2} 
              placeholder="—" 
              value={profile.address ?? ""} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Giấy tờ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(profile.documents ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">Chưa có tài liệu.</div>
            )}
            {(profile.documents ?? []).map((doc, idx) => (
              <div 
                key={doc.type || idx} 
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {doc.name ?? doc.type ?? "Tài liệu"}
                    </p>
                    {doc.expiry && (
                      <p className="text-xs text-muted-foreground">Hết hạn: {doc.expiry}</p>
                    )}
                    {doc.url && (
                      <a 
                        className="text-xs text-primary underline" 
                        href={doc.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Xem
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusBadgeClass(doc.status)}>
                    {getStatusText(doc.status)}
                  </Badge>
                  <Button variant="outline" size="sm">Tải lên</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}