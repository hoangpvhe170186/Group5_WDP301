import { Package, ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom"; // Thay thế Link từ Next.js bằng Link từ react-router-dom

export default function OrderHeader() {
  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Về trang chủ">
              <Home className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </Link>
            <Link
              to="/dat-hang"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Quay lại đặt hàng"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Quản lý và theo dõi đơn hàng của bạn</div>
        </div>
      </div>
    </header>
  );
}