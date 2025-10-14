import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Kiểu dữ liệu
type Sender = "guest" | "seller" | "bot";
type UiMessage = { sender: Sender; text: string; createdAt?: string };

// Tạo/lưu roomId để duy trì 1 cuộc trò chuyện duy nhất theo trình duyệt
function useRoomId() {
  const KEY = "he_chat_room_id";
  return useMemo(() => {
    let id = localStorage.getItem(KEY);
    if (!id) { id = `guest_${Date.now()}`; localStorage.setItem(KEY, id); }
    return id;
  }, []);
}


export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);

  // mode: "bot" = chatbot AI | "agent" = seller realtime
  const [mode, setMode] = useState<"bot" | "agent">("bot");

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomId = useRoomId();
const displayName =
  localStorage.getItem("fullName") ||
  localStorage.getItem("username") ||
  "Khách";
  // Kết nối socket 1 lần
  useEffect(() => {
    const s = io("http://localhost:4000");
    socketRef.current = s;

    s.emit("join_room", roomId);
    s.on("receive_message", (data: UiMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      s.off("receive_message");
      s.disconnect();
    };
  }, [roomId]);
useEffect(() => {
  if (mode !== "agent") return;
  (async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/chat/history?roomId=${encodeURIComponent(roomId)}&limit=100`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages.map((m: any) => ({
          sender: m.sender, text: m.text, name: m.name, createdAt: m.createdAt
        })));
      }
    } catch {}
  })();
}, [mode, roomId]);

  // Tự động cuộn
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Câu hỏi gợi ý ban đầu (chạy ở BOT mode)
  const questions: string[] = [
    "Tôi muốn biết bảng giá dịch vụ?",
    "Làm sao để đặt xe chuyển nhà?",
    "Có hỗ trợ đóng gói đồ không?",
    "Tôi có thể hẹn giờ chuyển đồ được không?",
  ];

  // Gửi tin nhắn từ khách
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    // Hiển thị ngay ở UI
    setMessages((prev) => [...prev, { sender: "guest", text }]);
    setInput("");

    if (mode === "agent") {
      // ↪️ Realtime: gửi qua socket cho seller
    socketRef.current?.emit("send_message", {
  roomId,
  sender: "guest",
  text,
  name: displayName,   // ✅ kèm tên
});
      return;
    }

    // 🤖 BOT mode: gọi API AI như cũ
    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: roomId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Không thể kết nối server." },
      ]);
    }
  };

  // Chuyển sang chat người thật
const handoffToAgent = () => {
  if (mode === "agent") return;
  setMode("agent");

  // KH nhìn thấy thông báo & lời chào (cục bộ)
  setMessages((prev) => [
    ...prev,
    { sender: "bot", text: "🔄 Đang kết nối với nhân viên hỗ trợ..." },
    { sender: "seller", text: "👋 Xin chào! Tôi là nhân viên hỗ trợ Home Express, tôi có thể giúp gì ạ?" },
  ]);

  socketRef.current?.emit("notify_support", {
    roomId,
    preview: "Khách yêu cầu hỗ trợ trực tiếp",
    name: displayName,
  });
};

// báo cho tất cả seller đang trực
 socketRef.current?.emit("notify_support", {
    roomId,
    preview: "Khách yêu cầu hỗ trợ trực tiếp",
    name: displayName,
  });


  // Quay lại chatbot
  const backToBot = () => setMode("bot");

  // UI
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6A00] text-white text-2xl shadow-xl hover:bg-[#e65f00] transition"
        >
          💬
        </button>
      )}

      {open && (
        <div className="w-96 h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#FF6A00] text-white px-5 py-3">
            <span className="font-semibold text-base">Home Express Chat</span>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-white/20">
                {mode === "bot" ? "🤖 Bot" : "🧑‍💼 Nhân viên"}
              </span>
              <button onClick={() => setOpen(false)} className="text-lg">✖</button>
            </div>
          </div>

          {/* Lịch sử */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-orange-50/20">
            {messages.length === 0 && mode === "bot" && (
              <>
                <p className="text-sm text-gray-600">
                  Xin chào 👋, bạn có thể chọn nhanh một câu hỏi:
                </p>
                <div className="space-y-2 mt-2">
                  {questions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(sendMessage, 0);
                      }}
                      className="block w-full text-left rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-2 rounded-md text-sm break-words ${
                  m.sender === "guest"
                    ? "bg-[#FFEDD5] text-gray-900 ml-auto"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Nhập & gửi */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-gray-200 p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder={mode === "bot" ? "Hỏi bot..." : "Nhắn cho nhân viên..."}
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
            />
            <button
              type="submit"
              className="rounded-md bg-[#FF6A00] text-white px-4 py-2 text-sm hover:bg-[#e65f00]"
            >
              Gửi
            </button>
          </form>

          {/* Thanh chuyển chế độ */}
          {mode === "bot" ? (
            <button
              className="bg-gray-100 hover:bg-gray-200 text-sm py-3 text-gray-700 font-medium"
              onClick={handoffToAgent}
            >
              🔄 Nói chuyện với nhân viên hỗ trợ
            </button>
          ) : (
            <button
              className="bg-gray-100 hover:bg-gray-200 text-sm py-3 text-gray-700 font-medium"
              onClick={backToBot}
            >
              ↩️ Quay lại Chatbot
            </button>
          )}
        </div>
      )}
    </div>
  );
}
