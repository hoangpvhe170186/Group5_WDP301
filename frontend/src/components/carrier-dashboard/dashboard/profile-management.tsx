// src/pages/carrier/dashboard/profile-management.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Camera, CheckCircle2 } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { CarrierProfile } from "@/types/carrier";

export function ProfileManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Load profile
  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const p = await carrierApi.getProfile();
      setProfile(p);
    } catch (e: any) {
      console.error("get profile error:", e);
      setErr("Không thể tải hồ sơ.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Handle save info
  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const updated = await carrierApi.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        licenseNumber: profile.licenseNumber,
        vehiclePlate: profile.vehiclePlate,
        avatarUrl: profile.avatarUrl, // lưu avatarUrl nếu có
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("update profile error:", e);
      alert("Cập nhật lỗi");
    } finally {
      setSaving(false);
    }
  };

  // Handle upload avatar
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      const url = await carrierApi.uploadAvatar(file);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      alert("Ảnh đại diện đã được cập nhật!");
    } catch (err) {
      console.error("upload avatar error:", err);
      alert("Tải ảnh thất bại!");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Đang tải hồ sơ...
        </CardContent>
      </Card>
    );
  }

  if (err || !profile) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {err || "Không có hồ sơ."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hồ sơ cá nhân</h2>
          <p className="text-muted-foreground">
            Quản lý thông tin và giấy tờ của bạn
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl ?? "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">
                  {profile.fullName?.split(" ").pop()?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    variant="secondary"
                    disabled={uploading}
                    onClick={() =>
                      document.getElementById("avatar-input")?.click()
                    }
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold">{profile.fullName}</h3>
              <p className="text-sm text-muted-foreground">
                {profile.phone ?? ""}
              </p>
              <Badge className="mt-2 bg-success/20 text-success">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Đã xác thực
              </Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={profile.fullName ?? ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={profile.phone ?? ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">Số GPLX</Label>
              <Input
                id="license"
                value={profile.licenseNumber ?? ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfile({ ...profile, licenseNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Biển số xe</Label>
              <Input
                id="plate"
                value={profile.vehiclePlate ?? ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfile({ ...profile, vehiclePlate: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
