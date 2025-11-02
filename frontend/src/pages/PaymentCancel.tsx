import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleBackToHistory = () => {
    navigate("/carrier/home");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Đang xử lý...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-orange-700 mb-2">Thanh toán đã bị hủy</h2>
          <p className="text-gray-600 mb-6">
            Bạn có thể thử lại thanh toán bất cứ lúc nào từ lịch sử công việc.
          </p>
          {orderCode && (
            <div className="text-sm text-gray-500 mb-4">
              <p>Mã đơn: {orderCode}</p>
            </div>
          )}
          <Button onClick={handleBackToHistory} className="w-full">
            Quay về Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
