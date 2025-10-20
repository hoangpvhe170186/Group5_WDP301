"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Upload, X, CheckCircle2, Video } from "lucide-react";
import { carrierApi } from "@/services/carrier.service";
import type { EvidencePhase } from "@/types/carrier";

interface UploadGoodsProps {
  type: "before" | "after";
  jobId: string | null;
  onBack: () => void;
  onUploaded?: () => void; // ✅ Optional để tránh crash nếu thiếu callback
}

export function UploadGoods({ type, jobId, onBack, onUploaded }: UploadGoodsProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!jobId || files.length === 0) return;
    setIsUploading(true);
    try {
      const phase: EvidencePhase = type === "before" ? "BEFORE" : "AFTER";
      await carrierApi.uploadEvidence({ orderId: jobId, phase, files });

      // ✅ SAFE CALL — không crash nếu không truyền vào
      onUploaded?.();
      onBack();
    } catch (e) {
      console.error("upload evidence error:", e);
      alert("Tải lên thất bại!");
    } finally {
      setIsUploading(false);
    }
  };

  const title = type === "before" ? "Chụp hàng trước khi lấy" : "Chụp hàng sau khi giao";
  const description =
    type === "before"
      ? "Chụp ảnh/video tình trạng hàng hóa trước khi lấy hàng làm bằng chứng"
      : "Chụp ảnh/video tình trạng hàng hóa sau khi giao hàng";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
              <p className="text-lg font-semibold text-foreground">{jobId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Thời gian</p>
              <p className="text-sm font-medium text-foreground">{new Date().toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Tải lên ảnh/video</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Nhấn để chọn file</p>
            <p className="text-sm text-muted-foreground">hoặc kéo thả file vào đây</p>
            <p className="text-xs text-muted-foreground mt-2">Hỗ trợ: JPG, PNG, MP4 (tối đa 50MB)</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />

          {files.length > 0 && (
            <div className="space-y-3">
              <Label>File đã chọn ({files.length})</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {file.type.startsWith("video/") ? <Video className="h-6 w-6 text-muted-foreground" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea id="notes" placeholder="Thêm ghi chú..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onBack} disabled={isUploading}>Hủy</Button>
            <Button className="flex-1 gap-2" onClick={handleUpload} disabled={files.length === 0 || isUploading}>
              {isUploading ? "Đang tải lên..." : (<><CheckCircle2 className="h-4 w-4" /> Xác nhận tải lên</>)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
