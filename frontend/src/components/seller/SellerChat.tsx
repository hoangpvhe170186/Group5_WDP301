import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Msg = { id: string; sender: "guest"|"seller"|"bot"; text: string; name?: string; roomId?: string; createdAt?: string; };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export default function SellerChat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const sellerName = localStorage.getItem("fullName") || localStorage.getItem("username") || "Seller";

  // socket
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.emit("join_room", roomId);

    const onReceive = (data: any) => {
      if (data?.roomId && data.roomId !== roomId) return;
      setMessages(prev => [...prev, { id: genId(), sender: data.sender, text: data.text, name: data.name ?? data.senderName, roomId, createdAt: data.createdAt }]);
    };
    s.on("receive_message", onReceive);

    return () => {
      s.off("receive_message", onReceive);
      s.disconnect();
    };
  }, [roomId]);

  // load lịch sử + auto-scroll
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/api/chat/history?roomId=${encodeURIComponent(roomId)}&limit=200`);
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
      requestAnimationFrame(() => {
        const el = boxRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    })();
  }, [roomId]);

  // auto-scroll khi có tin mới
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("send_message", { roomId, sender: "seller", name: sellerName, text });
    setMessages(prev => [...prev, { id: genId(), sender: "seller", text, name: sellerName, roomId, createdAt: new Date().toISOString() }]);
    setInput("");
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <h3 className="font-semibold mb-2">room: {roomId}</h3>
      <div ref={boxRef} className="h-72 overflow-y-auto border rounded p-2 mb-2 bg-white">
        {messages.map(m => {
          const isSeller = m.sender === "seller";
          const who = m.name || (m.sender === "guest" ? "Khách" : "Bot HE");
          return (
            <div key={m.id} className={`w-full my-1 flex ${isSeller ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-5 shadow-sm ${isSeller ? "bg-blue-50 border border-blue-200 text-blue-900" : "bg-gray-50 border border-gray-200 text-gray-800"}`}>
                <div className={`font-semibold mb-0.5 ${isSeller ? "text-blue-700" : "text-gray-700"}`}>{who}</div>
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập tin nhắn…"
        />
        <button onClick={send} className="px-3 py-1 rounded bg-blue-600 text-white">Gửi</button>
      </div>
    </div>
  );
}
