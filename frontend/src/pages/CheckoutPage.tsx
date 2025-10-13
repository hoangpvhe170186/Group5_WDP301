import { useLocation, Link } from 'react-router-dom';

// Hàm định dạng tiền tệ (bạn có thể import từ file dùng chung)
function formatCurrency(value?: number) {
    if (value == null) return "N/A";
    return value.toLocaleString("vi-VN") + "đ";
}

export default function CheckoutPage() {
    // Dùng hook 'useLocation' để lấy dữ liệu được gửi qua từ trang trước
    const location = useLocation();
    // Lấy state, có fallback `{}` để tránh lỗi nếu state không tồn tại
    const { bookingDetails } = location.state || {}; 

    // Nếu không có dữ liệu, hiển thị thông báo lỗi
    if (!bookingDetails) {
        return (
            <div className="text-center p-8 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold text-red-600">Lỗi: Không có thông tin đặt xe</h1>
                <p className="mt-4 text-gray-700">Vui lòng quay lại trang bảng giá và thực hiện tính cước trước khi thanh toán.</p>
                <Link to="/bang-gia" className="mt-6 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
                    Quay lại Bảng giá
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Xác nhận Đặt xe</h1>
                
                <div className="space-y-4 text-gray-800">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Gói dịch vụ:</span>
                        <span className="font-semibold">{bookingDetails.packageName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Quãng đường:</span>
                        <span className="font-semibold">{bookingDetails.distance} km</span>
                    </div>
                    <hr className="my-4"/>
                    <div className="flex justify-between items-center text-xl">
                        <span className="font-bold text-gray-900">Tổng cộng:</span>
                        <span className="font-bold text-orange-600 text-2xl">{formatCurrency(bookingDetails.totalFee)}</span>
                    </div>
                </div>

                <div className="mt-10">
                    <button 
                        onClick={() => alert('Chức năng thanh toán đang được phát triển!')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                        Tiến hành Thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
}