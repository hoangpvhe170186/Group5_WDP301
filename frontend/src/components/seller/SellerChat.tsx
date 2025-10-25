// SellerChat.tsx
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "../../realtime";

type Msg = {
  id: string;
  sender: "guest" | "seller" | "bot";
  text: string;
  name?: string;
  roomId?: string;
  createdAt?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// ---- Dedup helpers ----
const makeDedupKey = (
  roomId: string,
  sender: string,
  text: string,
  createdAt?: string
) => {
  const t = createdAt ? new Date(createdAt).getTime() : Date.now();
  const bucket = Math.floor(t / 5000); // gộp trong 5s
  return `${roomId}|${sender}|${text}|${bucket}`;
};

const globalProcessed = new Set<string>(); // chống trùng cross component
const DEDUP_TTL_MS = 10 * 60 * 1000; // 10 phút

function loadRoomSeen(roomId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(`he_seen_${roomId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { 
    return {}; 
  }
}

function saveRoomSeen(roomId: string, obj: Record<string, number>) {
  try {
    localStorage.setItem(`he_seen_${roomId}`, JSON.stringify(obj));
  } catch {}
}

const recentShown = new Map<string, number>();

export default function SellerChat({
  roomId,
  onNewMessage,
}: {
  roomId: string;
  onNewMessage?: () => void;
}) {
  const onNewMsgRef = useRef(onNewMessage);
  useEffect(() => { onNewMsgRef.current = onNewMessage; }, [onNewMessage]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const processed = useRef<Set<string>>(new Set()); // chống trùng cục bộ
  const currentRoomRef = useRef(roomId);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const sellerName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("username") ||
    "Seller";

  // ---------- Socket & room join/leave ----------
  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    // leave room cũ khi đổi room
    const prevRoom = currentRoomRef.current;
    if (prevRoom && prevRoom !== roomId) {
      try {
        s.emit("leave_room", prevRoom);
      } catch {}
      setMessages([]);
      processed.current.clear();
    }
    currentRoomRef.current = roomId;

    const onReceive = (data: any) => {
      if (!data?.roomId || data.roomId !== roomId) return;

      const sender = data.sender ?? "guest";
      const text = typeof data.text === "string" ? data.text : JSON.stringify(data.text ?? "");
      
      // Fix: Moved duplicate detection logic here
      const ls = loadRoomSeen(roomId);
      const now = Date.now();
      const hardKey = `${roomId}|${sender}|${text}`;
      const lastSeen = ls[hardKey] || 0;
      
      if (now - lastSeen < DEDUP_TTL_MS) return;
      
      ls[hardKey] = now;
      // dọn TTL cũ để không phình localStorage
      for (const key in ls) {
        if (now - ls[key] > DEDUP_TTL_MS) delete ls[key];
      }
      saveRoomSeen(roomId, ls);

      const softKey = `${roomId}|${sender}|${text}`;
      const last = recentShown.get(softKey) ?? 0;
      if (now - last < 3000) {
        return; // bỏ qua nếu 2 bản tin giống hệt nhau đến trong vòng 3s
      }
      recentShown.set(softKey, now);

      const k = makeDedupKey(roomId, sender, text, data.createdAt);

      if (processed.current.has(k) || globalProcessed.has(k)) return;
      processed.current.add(k);
      globalProcessed.add(k);

      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.roomId === roomId &&
            (m.sender ?? "guest") === sender &&
            (m.text ?? "") === text &&
            Math.abs(
              new Date(m.createdAt ?? 0).getTime() -
                new Date(data.createdAt ?? Date.now()).getTime()
            ) < 5000
        );
        if (exists) return prev;

        return [
          ...prev,
          {
            id: data.id || data.tempId || `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            sender: data.sender,
            text: data.text,
            name: data.name ?? data.senderName,
            roomId,
            createdAt: data.createdAt || new Date().toISOString(),
          },
        ];
      });
      
      onNewMessage?.();
    };

    const onConnected = () => s.emit("join_room", roomId);

    s.on("connect", onConnected);
    s.off("receive_message");         // vẫn giữ: chỉ SellerChat nghe event này
    s.on("receive_message", onReceive);
    if (s.connected) onConnected();

    return () => {
      // KHÔNG disconnect socket singleton — chỉ rời room & bỏ listener đúng callback
      try {
        s.emit("leave_room", roomId);
      } catch {}
      s.off("receive_message", onReceive);
      s.off("connect", onConnected);
    };
  }, [roomId]);

  // ---------- Load lịch sử khi đổi room ----------
  useEffect(() => {
    if (!roomId) return;

    const loadHistory = async () => {
      try {
        const normalizedRoomId = roomId.startsWith("guest_")
          ? roomId
          : `guest_${roomId}`;

        const res = await fetch(
          `${API_BASE}/api/chat/history?roomId=${encodeURIComponent(
            normalizedRoomId
          )}&limit=200`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (Array.isArray(data?.messages)) {
          const historyMessages: Msg[] = data.messages.map((m: any) => ({
            id: m._id || `hist_${m.createdAt}_${m.text}`,
            sender: m.sender,
            text: m.text,
            name: m.senderName,
            roomId: normalizedRoomId,
            createdAt: m.createdAt,
          }));

          // prefill dedup set theo lịch sử
          processed.current.clear();
          historyMessages.forEach((msg) => {
            const k = makeDedupKey(
              roomId,
              msg.sender ?? "guest",
              msg.text ?? "",
              msg.createdAt
            );
            processed.current.add(k);
            globalProcessed.add(k);
          });

          setMessages(historyMessages);

          // auto scroll
          setTimeout(() => {
            if (boxRef.current) {
              boxRef.current.scrollTop = boxRef.current.scrollHeight;
            }
          }, 60);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Load history error:", err);
        setMessages([]);
      }
    };

    loadHistory();
  }, [roomId]);

  // auto scroll khi có tin mới
  useEffect(() => {
    const el = boxRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 30);
    }
  }, [messages]);

  // gửi tin
  const send = () => {
    const text = input.trim();
    if (!text || !socketRef.current) return;

    const tempId = `seller_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    socketRef.current.emit("send_message", {
      roomId,
      sender: "seller",
      name: sellerName,
      text,
      tempId,
    });

    setInput("");
    onNewMsgRef.current?.();
  };

  return (
    <div className="p-4 border rounded-md bg-white h-full flex flex-col">
      <h3 className="font-semibold mb-2">💬 Chat với {roomId}</h3>
      <div
        ref={boxRef}
        className="flex-1 overflow-y-auto border rounded p-3 mb-3 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            Chưa có tin nhắn nào
          </div>
        ) : (
          messages.map((m) => {
            const isSeller = m.sender === "seller";
            const who = m.name || (m.sender === "guest" ? "Khách" : "Bot HE");
            return (
              <div
                key={m.id}
                className={`w-full my-2 flex ${
                  isSeller ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-5 ${
                    isSeller
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                  }`}
                >
                  <div
                    className={`font-semibold mb-1 text-xs ${
                      isSeller ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    {who}
                  </div>
                  <div className="break-words">{m.text}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isSeller ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString("vi-VN")
                      : "Vừa xong"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập tin nhắn…"
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!input.trim()}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}