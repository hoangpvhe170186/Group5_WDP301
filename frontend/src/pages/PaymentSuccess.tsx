import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const code = searchParams.get("code");
  const id = searchParams.get("id");
  const payosStatus = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Nếu có orderCode, kiểm tra debt status
        if (orderCode) {
          // Tìm orderId từ orderCode (có thể cần API mới)
          // Tạm thời hiển thị kết quả dựa trên PayOS status
          if (payosStatus === "PAID" && code === "00") {
            setStatus("success");
            setMessage(`Thanh toán hoa hồng cho đơn ${orderCode} thành công!`);
          } else {
            setStatus("error");
            setMessage("Thanh toán không thành công hoặc đã bị hủy.");
          }
        } else {
          setStatus("error");
          setMessage("Thiếu thông tin đơn hàng.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Có lỗi xảy ra khi kiểm tra trạng thái thanh toán.");
      }
    };

    checkPaymentStatus();
  }, [code, payosStatus, orderCode]);

  const handleBackToHistory = () => {
    navigate("/carrier/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Đang kiểm tra thanh toán...</h2>
              <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-700 mb-2">Thanh toán thành công!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Mã giao dịch: {id}</p>
                <p>Mã đơn: {orderCode}</p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">Thanh toán thất bại</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              {orderCode && (
                <div className="text-sm text-gray-500 mb-4">
                  <p>Mã đơn: {orderCode}</p>
                </div>
              )}
            </>
          )}

          <div className="mt-6 space-y-3">
            <Button onClick={handleBackToHistory} className="w-full">
              Quay về Dashboard
            </Button>
            {status === "success" && (
              <p className="text-xs text-gray-500">
                Trạng thái ghi nợ sẽ được cập nhật tự động
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
