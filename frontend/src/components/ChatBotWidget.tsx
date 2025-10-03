import { useState } from "react";

type Role = "user" | "bot";

type Message = {
  role: Role;
  text: string;
};

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const questions: string[] = [
    "Tôi muốn biết bảng giá dịch vụ?",
    "Làm sao để đặt xe chuyển nhà?",
    "Có hỗ trợ đóng gói đồ không?",
    "Tôi có thể hẹn giờ chuyển đồ được không?",
  ];

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
      setMessages([...newMessages, { role: "bot", text: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "bot", text: "❌ Không thể kết nối server." },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform"
        >
          💬
        </button>
      )}

      {open && (
        <div className="w-80 h-[480px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold">Home Express Chat</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hover:text-gray-200 text-lg"
            >
              ✖
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500">
                Xin chào 👋, hãy chọn câu hỏi hoặc nhập tin nhắn bên dưới.
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={m.text + idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-lg text-sm shadow ${
                    m.role === "user"
                      ? "bg-orange-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Quick questions */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full shadow-sm hover:bg-orange-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-2 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              onClick={() => sendMessage(input)}
              className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
            >
              Gửi
            </button>
          </div>

          {/* Footer: chuyển sang nhân viên */}
          <button
            className="bg-gray-100 hover:bg-gray-200 text-sm py-2 text-gray-700"
            onClick={async () => {
              await fetch("http://localhost:4000/api/chat/handoff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: "guest" }),
              });
              setMessages([
                ...messages,
                { role: "bot", text: "🔄 Đã chuyển sang nhân viên hỗ trợ." },
              ]);
            }}
          >
            🔄 Nói chuyện với nhân viên hỗ trợ
          </button>
        </div>
      )}
    </div>
  );
}
