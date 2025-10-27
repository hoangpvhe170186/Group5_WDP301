"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { carrierApi } from "@/services/carrier.service";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = { readonly orderId?: string };

export default function ComparePage(props: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Lấy orderId từ props hoặc params
  const orderId = useMemo(
    () => props.orderId ?? (params.orderId as string | undefined),
    [props.orderId, params.orderId]
  );

  // ✅ Nếu có state.from → dùng nó, không thì fallback về /carrier/home
  const backTo =
    (location.state as any)?.from ||
    (orderId ? `/carrier/home?job=${orderId}&view=job-details` : "/carrier/home");

  const [before, setBefore] = useState<any[]>([]);
  const [after, setAfter] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ====================== LOAD DATA ======================
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [b, a] = await Promise.all([
          carrierApi.listEvidence(orderId, "BEFORE"),
          carrierApi.listEvidence(orderId, "AFTER"),
        ]);

        setBefore(Array.isArray(b) ? b : b.items || []);
        setAfter(Array.isArray(a) ? a : a.items || []);
      } catch (e) {
        console.error("compare load error:", e);
        setErr("Không thể tải ảnh đối chiếu.");
        setBefore([]);
        setAfter([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // ====================== UI STATES ======================
  if (!orderId)
    return <div className="p-6">Thiếu mã đơn hàng.</div>;
  if (loading)
    return <div className="p-6 text-muted-foreground">Đang tải ảnh…</div>;
  if (err)
    return <div className="p-6 text-destructive">{err}</div>;

  // ====================== MAIN UI ======================
  return (
    <div className="p-6">
      {/* 🔙 Nút quay lại */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const lastJobId = localStorage.getItem("lastViewedJobId");
            if (lastJobId) {
              navigate(`/carrier/home?job=${lastJobId}&view=job-details`, { replace: false });
            } else {
              navigate("/carrier/home?view=overview");
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h2 className="text-2xl font-bold">
          Đối chiếu ảnh đơn hàng #{orderId}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* BEFORE */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Trước khi vận chuyển</h3>
          {before.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có ảnh.</p>
          ) : (
            before.map((m) => (
              <img
                key={m.id || m._id}
                src={`${API_URL}${m.url || m.file_url}`}
                crossOrigin="anonymous"
                className="rounded-lg border mb-3 w-full object-cover"
                alt="Ảnh trước khi lấy"
              />
            ))
          )}
        </div>

        {/* AFTER */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Sau khi vận chuyển</h3>
          {after.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có ảnh.</p>
          ) : (
            after.map((m) => (
              <img
                key={m.id || m._id}
                src={`${API_URL}${m.url || m.file_url}`}
                crossOrigin="anonymous"
                className="rounded-lg border mb-3 w-full object-cover"
                alt="Ảnh sau khi giao"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
