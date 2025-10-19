import { Package } from "lucide-react"

export default function OrderHeader() {
  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>
          </div>
          <div className="text-sm text-muted-foreground">Quản lý và theo dõi đơn hàng của bạn</div>
        </div>
      </div>
    </header>
  )
}
