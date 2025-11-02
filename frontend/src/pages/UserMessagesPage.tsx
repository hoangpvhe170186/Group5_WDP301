import { useEffect, useState, useRef } from "react";
import { socket } from "@/lib/socket";
import { MessageCircle, Send, User, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Message = {
  sender: "guest" | "seller" | "bot";
  text: string;
  createdAt: string;
  senderName?: string;
};

export default function UserMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  
  // ✅ Thêm dedupe refs
  const seenIdsRef = useRef<Set<string>>(new Set());
  const recentKeyRef = useRef<Map<string, number>>(new Map());
  const dedupeWindowMs = 3000;
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ FIX: Dùng đúng key từ localStorage
  const customerId = localStorage.getItem("user_id") || localStorage.getItem("userId") || localStorage.getItem("customer_id");
  const roomId = `customer:${customerId}`;
  const userName = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!).full_name
    : localStorage.getItem("fullName") || localStorage.getItem("username") || "Khách hàng";

  // ✅ Kết nối socket
  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    socket.emit("join_room", roomId);
    console.log("🔌 Customer joined room:", roomId);

    socket.on("connect", () => {
      console.log("🔌 Connected to chat server");
      setConnected(true);
      // Re-join room sau khi reconnect
      socket.emit("join_room", roomId);
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ Connection error:", err);
      setConnected(false);
    });

    socket.on("receive_message", (data) => {
      console.log("📨 Received message:", data);
      
      if (data.roomId && data.roomId !== roomId) {
        console.log("⚠️ Wrong room:", data.roomId, "expected:", roomId);
        return;
      }

      // ✅ Dedupe logic
      if (data.tempId) {
        if (seenIdsRef.current.has(data.tempId)) {
          console.log("⚠️ Duplicate tempId:", data.tempId);
          return;
        }
        seenIdsRef.current.add(data.tempId);
      } else {
        const key = `${data.sender}|${data.text}|${roomId}`;
        const now = Date.now();
        const last = recentKeyRef.current.get(key) || 0;
        if (now - last < dedupeWindowMs) {
          console.log("⚠️ Duplicate message within 3s");
          return;
        }
        recentKeyRef.current.set(key, now);
      }
      
      setMessages((prev) => [
        ...prev,
        {
          sender: data.sender,
          text: data.text,
          createdAt: data.createdAt || new Date().toISOString(),
          senderName: data.name || data.senderName,
        },
      ]);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("receive_message");
    };
  }, [roomId, customerId]);

  // ✅ Load lịch sử chat
  useEffect(() => {
    if (!customerId) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/chat/history?roomId=${encodeURIComponent(roomId)}&limit=200`
        );
        const data = await res.json();
        
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              createdAt: m.createdAt,
              senderName: m.senderName,
            }))
          );
        }
      } catch (err) {
        console.error("❌ Lỗi tải lịch sử chat:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [roomId, customerId]);

  // ✅ Gửi tin nhắn
  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const tempId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    seenIdsRef.current.add(tempId);

    console.log("📤 Sending message:", { roomId, text, tempId });

    socket.emit("send_message", {
      roomId,
      sender: "guest",
      name: userName,
      text,
      tempId,
    });

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        sender: "guest",
        text,
        createdAt: new Date().toISOString(),
        senderName: userName,
      },
    ]);

    setInput("");
  };

  // ✅ Auto scroll khi có tin mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Nếu chưa đăng nhập
  if (!customerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg">Vui lòng đăng nhập để xem tin nhắn</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-orange-500" />
              Tin nhắn của tôi
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Chat trực tiếp với nhân viên hỗ trợ Home Express
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {connected ? "Đã kết nối" : "Mất kết nối"}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p>Chưa có tin nhắn nào</p>
              <p className="text-sm mt-2">Hãy gửi tin nhắn đầu tiên để bắt đầu!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isCustomer = msg.sender === "guest";
                const displayName = msg.senderName || (isCustomer ? "Bạn" : "Nhân viên");

                return (
                  <div
                    key={idx}
                    className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${isCustomer ? "order-2" : "order-1"}`}>
                      {/* Sender name */}
                      <div
                        className={`flex items-center gap-1 mb-1 text-xs text-gray-500 ${
                          isCustomer ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isCustomer && <User className="w-3 h-3" />}
                        <span className="font-medium">{displayName}</span>
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isCustomer
                            ? "bg-orange-500 text-white rounded-br-none"
                            : msg.sender === "bot"
                            ? "bg-blue-100 text-gray-800 rounded-bl-none"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* ✅ Scroll anchor */}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!input.trim() || !connected}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </form>
          
          {!connected && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ Mất kết nối. Vui lòng kiểm tra kết nối mạng.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Câu hỏi thường gặp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "Làm sao để đặt dịch vụ?",
            "Bảng giá dịch vụ như thế nào?",
            "Có hỗ trợ đóng gói đồ không?",
            "Thời gian giao hàng bao lâu?",
          ].map((question, idx) => (
            <button
              key={idx}
              onClick={() => setInput(question)}
              className="text-left text-sm text-gray-600 hover:text-orange-500 transition p-3 rounded-lg hover:bg-orange-50 border border-gray-200"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}