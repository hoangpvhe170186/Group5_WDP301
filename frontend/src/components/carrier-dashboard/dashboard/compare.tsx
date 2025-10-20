import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { carrierApi } from "@/services/carrier.service";
import { API_URL } from "@/config/api";

type Props = { readonly orderId?: string };

export default function ComparePage(props: Props) {
  const params = useParams();
  const orderId = useMemo(
    () => props.orderId ?? (params.orderId as string | undefined),
    [props.orderId, params.orderId]
  );

  const [before, setBefore] = useState<any[]>([]);
  const [after, setAfter] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

        // ✅ Fix: API có thể trả [] hoặc {items: []}
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

  if (!orderId) return <div className="p-6">Thiếu mã đơn hàng.</div>;
  if (loading) return <div className="p-6 text-muted-foreground">Đang tải ảnh…</div>;
  if (err) return <div className="p-6 text-destructive">{err}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Đối chiếu ảnh đơn hàng #{orderId}</h2>

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
