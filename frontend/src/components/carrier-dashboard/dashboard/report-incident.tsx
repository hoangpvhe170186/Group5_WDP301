"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, AlertTriangle, Camera, Send } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";

interface ReportIncidentProps {
  jobId: string | null;
  onBack: () => void;
}

 const incidentTypes = [
    { value: "damage", label: "Hàng hóa bị hư hỏng" },
    { value: "missing", label: "Thiếu hàng" },
    { value: "delay", label: "Chậm trễ" },
    { value: "accident", label: "Tai nạn giao thông" },
    { value: "weather", label: "Thời tiết xấu" },
    { value: "vehicle", label: "Sự cố phương tiện" },
    { value: "customer", label: "Vấn đề với khách hàng" },
    { value: "other", label: "Khác" },
  ]

export function ReportIncident({ jobId, onBack }: ReportIncidentProps) {
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (!jobId || !incidentType || description.length < 10) return;
    setIsSubmitting(true);
    try {
      await carrierApi.reportIncident({
        orderId: jobId,
        type: `${incidentType}:${severity}`,
        description,
        photos,
      });
      alert("Báo cáo đã được gửi thành công!");
      onBack();
    } catch (e) {
      console.error("report incident error:", e);
      alert("Gửi thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const incidentTypes = [
    { value: "damage", label: "Hàng hóa bị hư hỏng" },
    { value: "missing", label: "Thiếu hàng" },
    { value: "delay", label: "Chậm trễ" },
    { value: "accident", label: "Tai nạn giao thông" },
    { value: "weather", label: "Thời tiết xấu" },
    { value: "vehicle", label: "Sự cố phương tiện" },
    { value: "customer", label: "Vấn đề với khách hàng" },
    { value: "other", label: "Khác" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">Báo cáo sự cố</h2>
          <p className="text-muted-foreground">Báo cáo vấn đề trong quá trình vận chuyển</p>
        </div>
      </div>

      <Card className="bg-warning/5 border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">Đơn hàng: {jobId}</p>
              <p className="text-xs text-muted-foreground">Thời gian: {new Date().toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Thông tin sự cố</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Loại sự cố *</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger id="incident-type"><SelectValue placeholder="Chọn loại sự cố" /></SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Mức độ *</Label>
            <RadioGroup value={severity} onValueChange={setSeverity}>
              <div className="flex items-center space-x-2 rounded-lg border border-border p-3">
                <RadioGroupItem value="low" id="low" /><Label htmlFor="low" className="flex-1 cursor-pointer">Thấp</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-border p-3">
                <RadioGroupItem value="medium" id="medium" /><Label htmlFor="medium" className="flex-1 cursor-pointer">Trung bình</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-destructive bg-destructive/5 p-3">
                <RadioGroupItem value="high" id="high" /><Label htmlFor="high" className="flex-1 cursor-pointer">Cao</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea id="description" placeholder="Mô tả chi tiết..." value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
          </div>

          <div className="space-y-2">
            <Label>Ảnh minh chứng</Label>
            <input type="file" accept="image/*" multiple onChange={handlePhotos} />
            <p className="text-xs text-muted-foreground">Ảnh giúp xử lý nhanh hơn</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={onBack} disabled={isSubmitting}>Hủy</Button>
        <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={!incidentType || !description || isSubmitting}>
          {isSubmitting ? "Đang gửi..." : (<><Send className="h-4 w-4" /> Gửi báo cáo</>)}
        </Button>
      </div>
    </div>
  );
}
