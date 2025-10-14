import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import SellerChat from "./SellerChat";

type Noti = { roomId: string; preview?: string; name?: string; at?: string };


export default function SupportInbox() {
  const [open, setOpen] = useState(false);         // mở/đóng panel hỗ trợ
  const [badge, setBadge] = useState(0);           // số thông báo chưa xem
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [queue, setQueue] = useState<Noti[]>([]);
  const socketRef = useRef<Socket | null>(null);

 useEffect(() => {
  const s = io("http://localhost:4000");
  socketRef.current = s;

  s.emit("join_support");

  const onNoti = (n: Noti) => {
    setQueue((q) => {
      const idx = q.findIndex(x => x.roomId === n.roomId);
      if (idx >= 0) { const copy = [...q]; copy[idx] = { ...copy[idx], ...n }; return copy; }
      return [n, ...q];
    });
    // ❌ KHÔNG cộng badge ở đây nữa
    setOpen(true);
    setCurrentRoom((r) => r ?? n.roomId);
  };

  const onBadge = (n: Noti) => {
    // chỉ khách nhắn mới tới đây
    setQueue((q) => {
      const idx = q.findIndex(x => x.roomId === n.roomId);
      if (idx >= 0) { const copy = [...q]; copy[idx] = { ...copy[idx], ...n }; return copy; }
      return [n, ...q];
    });
    setBadge((b) => b + 1); // ✅ badge tăng ở đây
  };

  s.on("support_notification", onNoti);
  s.on("support_badge", onBadge);

  return () => {
    s.off("support_notification", onNoti);
    s.off("support_badge", onBadge);
    s.disconnect();
  };
}, []);


  return (
    <>
      {/* Nút mở panel + badge */}
      <button
        onClick={() => { setOpen((v) => !v); setBadge(0); }}
        className="relative rounded-md bg-orange-500 px-3 py-2 text-white text-sm"
      >
        Hỗ trợ khách
        {badge > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 text-xs">{badge}</span>
        )}
      </button>

      {/* Panel hỗ trợ nổi */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[780px] max-w-[95vw] rounded-2xl border bg-white shadow-2xl">
          <div className="flex border-b p-3 justify-between items-center">
            <div className="font-semibold text-gray-800">Yêu cầu hỗ trợ trực tiếp</div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800">✖</button>
          </div>

          <div className="grid grid-cols-12">
            {/* danh sách cuộc chat */}
            <aside className="col-span-4 border-r max-h-[70vh] overflow-y-auto">
              {queue.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Chưa có yêu cầu mới.</div>
              )}
              {queue.map((n, idx) => (
                <button
                  key={`${n.roomId}-${idx}`}
                  onClick={() => setCurrentRoom(n.roomId)}
                  className={`block w-full text-left px-4 py-3 border-b hover:bg-orange-50 ${currentRoom === n.roomId ? "bg-orange-50" : ""}`}
                >
                  <div className="text-sm font-medium text-gray-800">{n.name ?? n.roomId}</div>
                  <div className="text-xs text-gray-500">{n.preview || "Khách cần hỗ trợ"}</div>
                </button>
              ))}
            </aside>

            {/* khung chat */}
            <main className="col-span-8 p-3">
              {currentRoom ? (
                <SellerChat roomId={currentRoom} />
              ) : (
                <div className="p-4 text-sm text-gray-500">Chọn 1 cuộc trò chuyện để trả lời.</div>
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
