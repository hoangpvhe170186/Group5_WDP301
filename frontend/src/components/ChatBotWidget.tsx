import { useState, useRef, useEffect } from "react";

type Role = "user" | "bot";

type Message = {
  role: Role;
  text: string;
};

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const questions: string[] = [
    "Tôi muốn biết bảng giá dịch vụ?",
    "Làm sao để đặt xe chuyển nhà?",
    "Có hỗ trợ đóng gói đồ không?",
    "Tôi có thể hẹn giờ chuyển đồ được không?",
  ];

  // Gửi tin nhắn tới backend
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: "guest" }),
      });
      const data = await res.json();

      const botMsg: Message = { role: "bot", text: data.reply };
      setMessages([...newMessages, botMsg]);
    } catch (err) {
      const errMsg: Message = {
        role: "bot",
        text: "❌ Không thể kết nối server.",
      };
      setMessages([...newMessages, errMsg]);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Nút mở chat */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6A00] text-white text-2xl shadow-xl hover:bg-[#e65f00] transition"
        >
          💬
        </button>
      )}

      {/* Hộp chat */}
      {open && (
        <div className="w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#FF6A00] text-white px-5 py-3">
            <span className="font-semibold text-base">Home Express Chat</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:text-gray-200 text-lg"
            >
              ✖
            </button>
          </div>

          {/* Lịch sử chat */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-orange-50/20">
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">
                Xin chào 👋, bạn có thể chọn nhanh một câu hỏi:
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={m.text + idx}
                className={`max-w-[80%] p-2 rounded-md text-sm break-words transition-all duration-200 ${
                  m.role === "user"
                    ? "bg-[#FFEDD5] text-gray-900 ml-auto animate-fadeIn"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm animate-fadeIn"
                }`}
              >
                {m.role === "user" ? "Bạn: " : "Bot: "} {m.text}
              </div>
            ))}

            {/* Gợi ý nếu chưa chat */}
            {messages.length === 0 && (
              <div className="space-y-2 mt-2">
                {questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* ✅ Cuộn xuống cuối */}
            <div ref={chatEndRef} />
          </div>

          {/* Ô nhập + gửi */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t border-gray-200 p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
            />
            <button
              type="submit"
              className="rounded-md bg-[#FF6A00] text-white px-4 py-2 text-sm hover:bg-[#e65f00]"
            >
              Gửi
            </button>
          </form>

          {/* Nút chuyển sang nhân viên */}
          <button
            className="bg-gray-100 hover:bg-gray-200 text-sm py-3 text-gray-700 font-medium"
            onClick={async () => {
              await fetch("http://localhost:4000/api/chat/handoff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: "guest" }),
              });
              const notify: Message = {
                role: "bot",
                text: "🔄 Đã chuyển sang nhân viên hỗ trợ.",
              };
              setMessages([...messages, notify]);
            }}
          >
            🔄 Nói chuyện với nhân viên hỗ trợ
          </button>
        </div>
      )}
    </div>
  );
}
