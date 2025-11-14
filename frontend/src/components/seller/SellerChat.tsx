// SellerChat.tsx - Sửa lỗi hoàn chỉnh
import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket"; // Đảm bảo đường dẫn đúng

type Msg = {
  id: string;
  sender: "guest" | "seller" | "bot";
  text: string;
  name?: string;
  roomId?: string;
  createdAt?: string;
};

type TypingUser = {
  userId: string;
  userName: string;
  isTyping: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

interface SellerChatProps {
  roomId: string;
  orderInfo?: {
    code: string;
    status: string;
    customerName?: string;
  };
}

export default function SellerChat({ roomId, orderInfo }: SellerChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const seenIdsRef = useRef<Set<string>>(new Set());
const recentKeyRef = useRef<Map<string, number>>(new Map());
const dedupeWindowMs = 3000;
  const boxRef = useRef<HTMLDivElement | null>(null);
  
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const sellerName = localStorage.getItem("fullName") || localStorage.getItem("username") || "Seller";
  const userId = localStorage.getItem("userId") || sellerName;

  // ✅ Kết nối socket
  useEffect(() => {
    if (!roomId) return;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_room", roomId);
      console.log("🔌 Seller joined room:", roomId);
    };

    const handleConnectError = (err: any) => {
      console.error("⚠️ Socket connection error:", err);
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    // Nếu đã kết nối, join room ngay
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [roomId]);

  // ✅ Lắng nghe tin nhắn
  useEffect(() => {
    if (!roomId) return;

const onReceive = (data: any) => {
  if (data?.roomId && data.roomId !== roomId) return;

  // Dedupe theo tempId
  if (data?.tempId) {
    if (seenIdsRef.current.has(data.tempId)) return;
    seenIdsRef.current.add(data.tempId);
  } else {
    const key = `${data.sender}|${data.text}|${roomId}`;
    const now = Date.now();
    const last = recentKeyRef.current.get(key) || 0;
    if (now - last < dedupeWindowMs) return;
    recentKeyRef.current.set(key, now);
  }

  const newMessage: Msg = {
    id: genId(),
    sender: data.sender,
    text: data.text,
    name: data.name ?? data.senderName,
    roomId,
    createdAt: data.createdAt || new Date().toISOString(),
  };
  setMessages((prev) => [...prev, newMessage]);
};


    const onUserTyping = (data: TypingUser & { roomId: string }) => {
      if (data.roomId !== roomId) return;
      
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        if (data.isTyping) {
          return [...filtered, { 
            userId: data.userId, 
            userName: data.userName || data.userId, 
            isTyping: true 
          }];
        }
        return filtered;
      });
    };

    socket.on("receive_message", onReceive);
    socket.on("user_typing", onUserTyping);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("user_typing", onUserTyping);
    };
  }, [roomId]);

  // ✅ Load lịch sử chat
  useEffect(() => {
    if (!roomId) return;

    const loadChatHistory = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/chat/history?roomId=${encodeURIComponent(roomId)}&limit=200`
        );
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        const arr = (data?.messages || []).map((m: any) => ({
          id: genId(),
          sender: m.sender,
          text: m.text,
          name: m.senderName,
          roomId,
          createdAt: m.createdAt,
        }));
        
        setMessages(arr);
        
        // Auto scroll sau khi tin nhắn được render
        setTimeout(() => {
          const el = boxRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        }, 100);
      } catch (err) {
        console.error("⚠️ Lỗi tải lịch sử chat:", err);
      }
    };

    loadChatHistory();
  }, [roomId]);

  // ✅ Auto scroll khi có tin mới
  useEffect(() => {
    const el = boxRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, typingUsers]);

  // ✅ Xử lý typing indicator
  const handleTyping = (typing: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (typing) {
      socket.emit("typing", {
        roomId,
        userId,
        userName: sellerName,
        isTyping: true
      });

      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    } else {
      socket.emit("typing", {
        roomId,
        userId,
        userName: sellerName,
        isTyping: false
      });
    }
  };

    // ✅ Gửi tin nhắn
  const send = () => {
    const text = input.trim();
    if (!text || !roomId) return;

    const tempId = genId();
    seenIdsRef.current.add(tempId);

    socket.emit("send_message", {
      roomId,
      sender: "seller",
      name: sellerName,
      text,
      userId,
      tempId,
    });

    // Optimistic UI
    const newMessage: Msg = {
      id: tempId,
      sender: "seller",
      text,
      name: sellerName,
      roomId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    handleTyping(false);
  };


  // ✅ Lưu tin nhắn vào database
  const persistMessage = async (messageData: {
    roomId: string;
    sender: "guest" | "seller" | "bot";
    senderName?: string;
    text: string;
  }) => {
    try {
      await fetch(`${API_BASE}/api/chat/append`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error("Lỗi lưu tin nhắn:", error);
    }
  };

  // Extract order code từ roomId
  const orderCode = roomId.startsWith("order:") ? roomId.replace("order:", "") : null;
  const visibleMessages = messages.filter((m) => m.sender !== "bot");

  return (
    <div className="p-4 border rounded-md bg-white h-full flex flex-col">
      {/* Header với thông tin đơn hàng */}
      <div className="border-b pb-2 mb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            💬 Chat đơn hàng: {orderInfo?.code || orderCode || "Hỗ trợ"}
          </h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Đã kết nối' : 'Mất kết nối'} />
        </div>
        {orderInfo?.customerName && (
          <p className="text-sm text-gray-600">Khách hàng: {orderInfo.customerName}</p>
        )}
        {orderInfo?.status && (
          <p className="text-xs text-gray-500">Trạng thái: {orderInfo.status}</p>
        )}
      </div>

      {/* Khung chat */}
      <div
        ref={boxRef}
        className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-gray-50 min-h-[300px] max-h-[400px]"
      >
        {visibleMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          <>
            {visibleMessages.map((m) => {
              const isSeller = m.sender === "seller";
              const who = m.name || (m.sender === "guest" ? "Khách" : "Bot HE");
              
              return (
                <div
                  key={m.id}
                  className={`w-full my-1 flex ${isSeller ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-5 shadow-sm ${
                      isSeller
                        ? "bg-blue-100 border border-blue-300 text-blue-900"
                        : "bg-white border border-gray-300 text-gray-800"
                    }`}
                  >
                    <div
                      className={`font-semibold mb-0.5 text-xs ${
                        isSeller ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {who}
                    </div>
                    <div className="text-sm break-words">{m.text}</div>
                    {m.createdAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(m.createdAt).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Hiển thị typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start my-1">
                <div className="max-w-[75%] rounded-lg px-3 py-2 bg-white border border-gray-300">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="text-xs text-gray-600 italic ml-2">
                      {typingUsers.map(user => user.userName).join(', ')} đang nhập...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ô nhập tin nhắn */}
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTyping(e.target.value.length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          onBlur={() => handleTyping(false)}
          placeholder="Nhập tin nhắn…"
          disabled={!isConnected}
        />
        <button
          onClick={send}
          disabled={!input.trim() || !isConnected}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          Gửi
        </button>
      </div>
      
      {!isConnected && (
        <div className="text-xs text-red-500 mt-2">
          ⚠️ Mất kết nối. Vui lòng kiểm tra kết nối mạng.
        </div>
      )}
    </div>
  );
}
