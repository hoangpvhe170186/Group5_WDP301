import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Msg = {
  id: string;
  sender: "guest" | "seller";
  text: string;
  name?: string;
  createdAt?: string;
};

export default function SellerChat({ roomId }: Readonly<{ roomId: string }>) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4001";
  const socket = io(SOCKET_URL);
  const genId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    // tạo socket 1 lần cho component
    const s = io("http://localhost:4000");
    socketRef.current = s;

    s.emit("join_room", roomId);

    const onReceive = (data: Omit<Msg, "id">) => {
      setMessages((prev) => [...prev, { id: genId(), ...data }]);
    };
    s.on("receive_message", onReceive);

    return () => {
      s.off("receive_message", onReceive);
      s.disconnect();
    };
  }, [roomId]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    // gửi cho khách (không echo lại seller)
    socketRef.current?.emit("send_message", { roomId, sender: "seller", text });

    // append local cho seller nhìn thấy ngay
    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        sender: "seller",
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <h3 className="font-semibold mb-2">Chat với khách (room: {roomId})</h3>
      <div className="h-72 overflow-y-auto border rounded p-2 mb-2 bg-white">
        {messages.map((m) => {
          const isSeller = m.sender === "seller";
          const who = m.name || (m.sender === "guest" ? "Khách" : "Seller");
          return (
            <div
              key={m.id}
              className={`w-full my-1 flex ${
                isSeller ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-5 shadow-sm
            ${
              isSeller
                ? "bg-blue-50 border border-blue-200 text-blue-900"
                : "bg-gray-50 border border-gray-200 text-gray-800"
            }`}
              >
                <div
                  className={`font-semibold mb-0.5 ${
                    isSeller ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  {who}
                </div>
                <div>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn…"
        />
        <button
          onClick={send}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
