// frontend/src/components/seller/SupportInbox.tsx
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import SellerChat from "./SellerChat";

type Noti = { roomId: string; preview?: string; name?: string; at?: string };

export default function SupportInbox() {
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [queue, setQueue] = useState<Noti[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

  // Dùng Set để chống trùng theo roomId
  const seenRoomsRef = useRef<Set<string>>(new Set());

  // ---- 1) Load danh sách room gần đây khi mount (sau reload vẫn có list) ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/rooms?limit=30`);
        const data = await res.json();
        if (!mounted) return;

        const rooms: Noti[] = (data.rooms || []).map((r: any) => ({
          roomId: r.roomId,
          preview: r.preview,
          name: r.name,
          at: r.at,
        }));

        // lưu vào set chống trùng
        rooms.forEach((r) => seenRoomsRef.current.add(r.roomId));

        // sort mới nhất trước
        rooms.sort(
          (a, b) =>
            new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()
        );

        setQueue(rooms);
        setCurrentRoom((r) => r ?? rooms[0]?.roomId ?? null);
      } catch {
        // bỏ qua lỗi load list
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // ---- 2) Socket support inbox ----
useEffect(() => {
  const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
  socketRef.current = s;
  s.emit("join_support");

  // thông báo mở ticket
  const onNoti = (n: Noti) => {
    upsertRoom({ ...n, at: n.at || new Date().toISOString(), fromSender: "guest" });
    setOpen((v) => v || true);
    setCurrentRoom((r) => r ?? n.roomId);
  };

  // badge khi KH nhắn
  const onBadge = (n: Noti) => {
    upsertRoom({ ...n, at: n.at || new Date().toISOString(), fromSender: "guest" });
    setBadge((b) => b + 1);
  };

  // bất kỳ tin nhắn nào đến
  const onReceiveForList = (m: { roomId?: string; text: string; name?: string; sender?: "guest"|"seller"|"bot"; createdAt?: string }) => {
    if (!m.roomId) return;
    upsertRoom({
      roomId: m.roomId,
      preview: m.text,
      name: m.name,
      at: m.createdAt || new Date().toISOString(),
      fromSender: m.sender,           // << dùng để quyết định có ghi đè name không
    });
  };

  s.on("support_notification", onNoti);
  s.on("support_badge", onBadge);
  s.on("receive_message", onReceiveForList);

  return () => {
    s.off("support_notification", onNoti);
    s.off("support_badge", onBadge);
    s.off("receive_message", onReceiveForList);
    s.disconnect();
  };
}, [SOCKET_URL]);

  // ---- 3) Chọn room: reset badge tổng (bạn có thể thay bằng badge theo room nếu muốn) ----
  const onPickRoom = (rid: string) => {
    setCurrentRoom(rid);
    setBadge(0);
  };

  return (
    <>
      {/* Nút mở panel + badge */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setBadge(0);
        }}
        className="relative rounded-md bg-orange-500 px-3 py-2 text-white text-sm"
      >
        Hỗ trợ khách
        {badge > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 text-xs">
            {badge}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[780px] max-w-[95vw] rounded-2xl border bg-white shadow-2xl">
          <div className="flex border-b p-3 justify-between items-center">
            <div className="font-semibold text-gray-800">
              Yêu cầu hỗ trợ trực tiếp
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              ✖
            </button>
          </div>

          <div className="grid grid-cols-12">
            {/* danh sách cuộc chat */}
            <aside className="col-span-4 border-r max-h-[70vh] overflow-y-auto">
              {queue.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  Chưa có yêu cầu mới.
                </div>
              )}
              {queue.map((n) => (
                <button
                  key={n.roomId}
                  onClick={() => onPickRoom(n.roomId)}
                  className={`block w-full text-left px-4 py-3 border-b hover:bg-orange-50 ${
                    currentRoom === n.roomId ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">
                    {n.name ?? n.roomId}
                  </div>
                  <div className="text-xs text-gray-500">
                    {n.preview || "Khách cần hỗ trợ"}
                  </div>
                </button>
              ))}
            </aside>

            {/* khung chat */}
            <main className="col-span-8 p-3">
              {currentRoom ? (
                <SellerChat key={currentRoom} roomId={currentRoom} />
              ) : null}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
function upsertRoom(arg0: { at: string; fromSender: string; roomId: string; preview?: string; name?: string; }) {
  throw new Error("Function not implemented.");
}

