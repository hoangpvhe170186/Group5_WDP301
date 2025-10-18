import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// --- Kiểu dữ liệu ---
type Sender = "guest" | "seller" | "bot";
type UiMessage = { sender: Sender; text: string; createdAt?: string };

// --- Helpers env ---
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_BASE || "http://localhost:4000";

// --- RoomID duy trì theo trình duyệt ---
function useRoomId() {
  const KEY = "he_chat_room_id";
  return useMemo(() => {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = `guest_${Date.now()}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  }, []);
}
async function persistMessage({
  roomId,
  sender,
  senderName,
  text,
}: {
  roomId: string;
  sender: "guest" | "seller" | "bot";
  senderName?: string;
  text: string;
}) {
  try {
    await fetch(`${API_BASE}/api/chat/append`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, sender, senderName, text }),
    });
  } catch {}
}
// --- Component chính ---
export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"bot" | "agent">("bot");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [connErr, setConnErr] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const roomId = useRoomId();
  const displayName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("username") ||
    "Khách";

  // ✅ Kết nối socket 1 lần duy nhất
  useEffect(() => {
    setConnErr(null);

    const s = io(SOCKET_URL, {
      // Cho phép websocket và fallback polling để tránh bị chặn bởi proxy/cors
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 600,
    });

    socketRef.current = s;

    s.on("connect", () => setConnErr(null));
    s.on("connect_error", (err) => {
      setConnErr(err?.message || "Không thể kết nối server.");
    });

    s.emit("join_room", roomId);

    // Nhận tin nhắn realtime
    s.on(
      "receive_message",
      (data: UiMessage & { roomId?: string; name?: string }) => {
        setMessages((prev) => [...prev, data]);
        // ✅ lưu DB khi nhận tin từ seller/bot qua socket
        persistMessage({
          roomId,
          sender: (data.sender as any) || "seller",
          senderName: data?.name,
          text: data.text,
        });
      }
    );

    return () => {
      s.off("receive_message");
      s.off("connect_error");
      s.off("connect");
      s.disconnect();
    };
  }, [roomId]);

  // Lấy lịch sử khi chuyển sang agent
  useEffect(() => {
    if (mode !== "agent") return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/chat/history?roomId=${encodeURIComponent(
            roomId
          )}&limit=100`
        );
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              createdAt: m.createdAt,
            }))
          );
        }
      } catch (err) {
        console.error("⚠️ Lỗi tải lịch sử chat:", err);
      }
    })();
  }, [mode, roomId]);

  // Auto scroll khi có tin mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gợi ý câu hỏi cho chatbot
  const questions = [
    "Tôi muốn biết bảng giá dịch vụ?",
    "Làm sao để đặt xe chuyển nhà?",
    "Có hỗ trợ đóng gói đồ không?",
    "Tôi có thể hẹn giờ chuyển đồ được không?",
  ];

  // ✅ Gửi tin nhắn
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const name = displayName;

    // ✅ append UI + lưu DB (khách)
    setMessages((prev) => [...prev, { sender: "guest", text }]);
    setInput("");
    persistMessage({ roomId, sender: "guest", senderName: name, text });

    if (mode === "agent") {
      socketRef.current?.emit("send_message", {
        roomId,
        sender: "guest",
        name: displayName,
        text,
      });
      return;
    }

    // 🤖 Chatbot AI (REST)
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: roomId }),
      });
      const data = await res.json();
      const reply = data.reply || "❌ Bot chưa trả lời được.";
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);

      // ✅ lưu DB (bot)
      persistMessage({
        roomId,
        sender: "bot",
        senderName: "Bot HE",
        text: reply,
      });
    } catch {
      const fallback = "❌ Không thể kết nối server.";
      setMessages((prev) => [...prev, { sender: "bot", text: fallback }]);
      persistMessage({
        roomId,
        sender: "bot",
        senderName: "Bot HE",
        text: fallback,
      });
    }
  };

  // ✅ Chuyển sang nói chuyện với nhân viên
  const handoffToAgent = () => {
    if (mode === "agent") return;
    setMode("agent");
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "🔄 Đang kết nối với nhân viên hỗ trợ..." },
      {
        sender: "seller",
        text: "👋 Xin chào! Tôi là nhân viên hỗ trợ Home Express, tôi có thể giúp gì ạ?",
      },
    ]);

    socketRef.current?.emit("notify_support", {
      roomId,
      preview: "Khách yêu cầu hỗ trợ trực tiếp",
      name: displayName,
    });
  };

  // Quay lại chatbot
  const backToBot = () => setMode("bot");

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
              <button onClick={() => setOpen(false)} className="text-lg">
                ✖
              </button>
            </div>
          </div>

          {/* Nội dung chat */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-orange-50/20">
            {connErr && (
              <div className="text-xs text-red-600 mb-2">
                ⚠️ {connErr} — kiểm tra backend có đang chạy ở {SOCKET_URL}{" "}
                không.
              </div>
            )}

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

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-gray-200 p-3 flex gap-2"
          >
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(); // <- hàm bạn đang dùng để gửi
                }
              }}
              placeholder={
                mode === "agent" ? "Nhắn cho nhân viên..." : "Hỏi bot..."
              }
            />
            <button
              type="submit"
              className="rounded-md bg-[#FF6A00] text-white px-4 py-2 text-sm hover:bg-[#e65f00]"
            >
              Gửi
            </button>
          </form>

          {/* Nút chuyển chế độ */}
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
