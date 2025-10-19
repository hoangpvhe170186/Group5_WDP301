import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { carrierApi } from "@/services/carrier.service";

type Props = { orderId?: string };

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
        setBefore(b.items || []);
        setAfter(a.items || []);
      } catch (e) {
        console.error("compare load error:", e);
        setErr("Không thể tải ảnh đối chiếu.");
        setBefore([]); setAfter([]);
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
      <h2 className="text-2xl font-bold mb-4">Đối chiếu ảnh đơn hàng #{orderId}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Trước khi vận chuyển</h3>
          {before.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có ảnh.</p> :
            before.map((m) => (
              <img key={m._id} src={m.thumb_url || m.file_url} className="rounded-lg border mb-2" />
            ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Sau khi vận chuyển</h3>
          {after.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có ảnh.</p> :
            after.map((m) => (
              <img key={m._id} src={m.thumb_url || m.file_url} className="rounded-lg border mb-2" />
            ))}
        </div>
      </div>
    </div>
  );
}