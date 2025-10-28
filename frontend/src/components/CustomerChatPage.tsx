// CustomerChatPage.tsx - Phiên bản đơn giản cho HomePage
import { useState } from "react";
import ChatBotWidget from "./ChatBotWidget";

interface CustomerChatPageProps {
  setShowChatPage?: (show: boolean) => void;
}
export default function CustomerChatPage({ setShowChatPage }: CustomerChatPageProps) {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const handleBackToHome = () => {
    if (setShowChatPage) {
      setShowChatPage(false);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                💬 Trung tâm hỗ trợ
              </h1>
              <p className="text-gray-600 mt-1">
                Chat trực tiếp với nhân viên hỗ trợ của Home Express
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFullScreen(!showFullScreen)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
              >
                {showFullScreen ? "Thu nhỏ" : "Mở rộng"}
              </button>
              <button
                onClick={handleBackToHome}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                ← Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin hỗ trợ */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📞 Liên hệ hỗ trợ
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <span className="w-6">📞</span>
                  <span>Hotline: 1900 1234</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="w-6">✉️</span>
                  <span>Email: support@homeexpress.com</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="w-6">🕒</span>
                  <span>Thời gian: 7:00 - 22:00</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ❓ Câu hỏi thường gặp
              </h3>
              <div className="space-y-2">
                {[
                  "Làm sao để đặt dịch vụ?",
                  "Bảng giá dịch vụ như thế nào?",
                  "Có hỗ trợ đóng gói đồ không?",
                  "Thời gian giao hàng bao lâu?",
                  "Có bảo hiểm hàng hóa không?"
                ].map((question, index) => (
                  <button
                    key={index}
                    className="block w-full text-left text-sm text-gray-600 hover:text-orange-500 transition p-2 rounded hover:bg-gray-50"
                    onClick={() => {
                      // Tự động điền câu hỏi vào ô chat
                      const input = document.querySelector('input[placeholder*="Nhập câu hỏi"], input[placeholder*="Nhắn tin"]') as HTMLInputElement;
                      if (input) {
                        input.value = question;
                        input.focus();
                      }
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Khung chat - chiếm 2/3 màn hình */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-lg shadow-sm ${showFullScreen ? 'fixed inset-4 z-50' : 'relative'}`}>
              {showFullScreen && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setShowFullScreen(false)}
                    className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition"
                  >
                    ✕
                  </button>
                </div>
              )}
              {/* ChatBotWidget sẽ tự động kết nối với roomId phù hợp */}
              <ChatBotWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}