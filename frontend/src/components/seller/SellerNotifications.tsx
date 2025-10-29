import { useEffect, useState } from "react";
import { api } from "@/config/api";
import { io } from "socket.io-client";

type Noti = {
  _id: string;
  message: string;
  type: "DriverInterview" | "System" | "Order Update";
  is_read: boolean;
  ref_type?: "DriverInterview";
  ref_id?: string;
  created_at: string;
};

export default function SellerNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);

  const load = async () => {
  try {
    const { data } = await api.get("/api/notifications", {
      params: { type: "DriverInterview", recipient_role: "seller" },
    });
    setItems(data);
  } catch (error) {
    console.error("Failed to load notifications:", error);
  }
};

  useEffect(() => { 
    load(); 
    
    // Kết nối socket để nhận thông báo realtime
    const socket = io("http://localhost:4000");
    
    socket.emit("join_support");
    
    socket.on("new_notification", (data) => {
      if (data.type === "DriverInterview") {
        load(); // Reload khi có thông báo mới
      }
    });

    const interval = setInterval(load, 15000);
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const unread = items.filter(i => !i.is_read).length;

  const markRead = async (id: string) => {
  try {
    await api.patch(`/api/notifications/${id}/read`);
    load();
  } catch (error) {
    console.error("Failed to mark as read:", error);
  }
};

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(v => !v)} 
        className="relative text-gray-500 hover:text-gray-800"
      >
        {/* Icon chuông */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-3.79 1.44 5.97 5.97 0 01-3.79-1.44M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-xl border bg-white shadow-xl z-50">
          <div className="p-3 font-semibold border-b">Thông báo</div>
          <div className="max-h-96 overflow-auto divide-y">
            {items.length === 0 && (
              <div className="p-4 text-sm text-gray-500">Không có thông báo</div>
            )}
            {items.map(n => (
              <div key={n._id} className="p-3 hover:bg-gray-50">
                <div className="text-sm">{n.message}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  <div className="flex gap-2">
                    {n.ref_type === "DriverInterview" && n.ref_id && (
                      <a 
                        className="text-purple-600 hover:underline" 
                        href={`/seller/driver-applications`}
                        onClick={() => setOpen(false)}
                      >
                        Xem hồ sơ
                      </a>
                    )}
                    {!n.is_read && (
                      <button 
                        className="text-gray-600 hover:underline" 
                        onClick={() => markRead(n._id)}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}