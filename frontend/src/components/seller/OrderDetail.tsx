  // frontend/src/pages/seller/OrderDetail.tsx
  import SellerChat from "./SellerChat";

  export default function OrderDetail() {
    const orderId = "HE-84261"; // lấy từ params/router thật
    const roomId = `order:${orderId}`;
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section>{/* ...thông tin đơn hàng... */}</section>
        <aside>
          <SellerChat roomId={roomId} />
        </aside>
      </div>
    );
  }
