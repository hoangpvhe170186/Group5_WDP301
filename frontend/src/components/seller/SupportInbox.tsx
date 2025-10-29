import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import SellerChat from "./SellerChat";

type Noti = { 
  roomId: string; 
  preview?: string; 
  name?: string; 
  at?: string;
  customerName?: string; // ✅ Thêm tên khách hàng
};

export default function SupportInbox() {
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [queue, setQueue] = useState<Noti[]>([]);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const seenRoomsRef = useRef<Set<string>>(new Set());

  // ---- 1) Load danh sách room gần đây khi mount ----
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
          customerName: r.customerName, // ✅ Backend cần trả về
        }));

        rooms.forEach((r) => seenRoomsRef.current.add(r.roomId));
        rooms.sort(
          (a, b) =>
            new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()
        );

        setQueue(rooms);
        setCurrentRoom((r) => r ?? rooms[0]?.roomId ?? null);
      } catch (err) {
        console.error("⚠️ Lỗi tải danh sách room:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // ---- 2) Socket support inbox ----
  useEffect(() => {
    socket.emit("join_support");

    // thông báo mở ticket
    const onNoti = (n: Noti) => {
      upsertRoom({
        ...n,
        at: n.at || new Date().toISOString(),
        fromSender: "guest",
      });
      setOpen((v) => v || true);
      setCurrentRoom((r) => r ?? n.roomId);
    };

    // badge khi KH nhắn
    const onBadge = (n: Noti) => {
      upsertRoom({
        ...n,
        at: n.at || new Date().toISOString(),
        fromSender: "guest",
      });
      setBadge((b) => b + 1);
    };

    // bất kỳ tin nhắn nào đến
    const onReceiveForList = (m: {
      roomId?: string;
      text: string;
      name?: string;
      sender?: "guest" | "seller" | "bot";
      createdAt?: string;
    }) => {
      if (!m.roomId) return;
      upsertRoom({
        roomId: m.roomId,
        preview: m.text,
        name: m.name,
        at: m.createdAt || new Date().toISOString(),
        fromSender: m.sender,
      });
    };

    socket.on("support_notification", onNoti);
    socket.on("support_badge", onBadge);
    socket.on("receive_message", onReceiveForList);

    // Cleanup
    return () => {
      socket.off("support_notification", onNoti);
      socket.off("support_badge", onBadge);
      socket.off("receive_message", onReceiveForList);
    };
  }, []);

  // ---- 3) Chọn room: reset badge tổng ----
  const onPickRoom = (rid: string) => {
    setCurrentRoom(rid);
    setBadge(0);
  };

  // ✅ Helper function để upsert room
  const upsertRoom = (n: any) => {
    setQueue((prev) => {
      const exists = prev.find((r) => r.roomId === n.roomId);
      if (exists) {
        // Cập nhật tin nhắn mới nhất
        return prev.map((r) =>
          r.roomId === n.roomId
            ? { ...r, preview: n.preview || r.preview, at: n.at }
            : r
        ).sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
      } else {
        // Thêm room mới
        const newRoom: Noti = {
          roomId: n.roomId,
          preview: n.preview,
          name: n.name,
          at: n.at,
          customerName: n.customerName || extractCustomerName(n.roomId, n.name),
        };
        return [newRoom, ...prev].sort(
          (a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()
        );
      }
    });
  };

  // ✅ Extract customer name từ roomId hoặc name
  const extractCustomerName = (roomId: string, name?: string): string => {
    if (name) return name;
    if (roomId.startsWith("customer:")) {
      const customerId = roomId.replace("customer:", "");
      return `Khách #${customerId.substring(0, 8)}...`;
    }
    if (roomId.startsWith("order:")) {
      return `Đơn #${roomId.replace("order:", "")}`;
    }
    return roomId;
  };

  // ✅ Hiển thị tên customer trong danh sách
  const getDisplayName = (room: Noti): string => {
    return room.customerName || room.name || extractCustomerName(room.roomId);
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
        <div className="fixed bottom-6 right-6 w-[780px] max-w-[95vw] rounded-2xl border bg-white shadow-2xl z-50">
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
                  className={`block w-full text-left px-4 py-3 border-b hover:bg-orange-50 transition ${
                    currentRoom === n.roomId ? "bg-orange-50 border-l-4 border-orange-500" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">
                    👤 {getDisplayName(n)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {n.preview || "Khách cần hỗ trợ"}
                  </div>
                  {n.at && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(n.at).toLocaleString("vi-VN")}
                    </div>
                  )}
                </button>
              ))}
            </aside>

            {/* khung chat */}
            <main className="col-span-8 p-3">
              {currentRoom ? (
                <SellerChat 
                  key={currentRoom} 
                  roomId={currentRoom}
                  orderInfo={{
                    code: extractCustomerName(currentRoom),
                    status: "Đang hỗ trợ",
                    customerName: queue.find(q => q.roomId === currentRoom)?.customerName,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chọn một cuộc hội thoại để bắt đầu
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
}