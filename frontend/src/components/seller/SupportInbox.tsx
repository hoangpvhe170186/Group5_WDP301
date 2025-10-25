import { useEffect, useRef, useState, useCallback } from "react";
import SellerChat from "./SellerChat";
import type { Socket } from "socket.io-client";
import { getSocket } from "../../realtime";
type UserRoom = {
  roomId: string;
  userName: string;
  userEmail: string;
  lastActivity: Date;
  unreadCount: number;
  userId?: string;
};

export default function SupportInbox() {
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 REF để tracking
  const socketRef = useRef<Socket | null>(null);
  const processedRooms = useRef<Set<string>>(new Set());

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

  // 🔥 Load users - ĐƠN GIẢN HÓA
const loadAllUserRooms = useCallback(async () => {
  setIsLoading(true);
  try {
    console.log("🔄 Loading user rooms...");
    
    let usersData = { data: [] };
    let roomsData = { rooms: [] };

    try {
      const usersRes = await fetch(`${API_BASE}/api/users?role=Customer&limit=100`);
      usersData = await usersRes.json();
      console.log("✅ Loaded users:", usersData.data?.length || 0);
    } catch (error) {
      console.error("❌ Error loading users:", error);
    }

    try {
      const roomsRes = await fetch(`${API_BASE}/api/chat/rooms?limit=100`);
      roomsData = await roomsRes.json();
      console.log("✅ Loaded chat rooms:", roomsData.rooms?.length || 0);
    } catch (error) {
      console.error("❌ Error loading chat rooms:", error);
    }

    const rooms: UserRoom[] = [];

    // 🔥 FIX: Tạo roomId CHUẨN từ userId
    if (usersData.data && Array.isArray(usersData.data)) {
      usersData.data.forEach((user: any) => {
        // 🔥 QUAN TRỌNG: Đảm bảo roomId format chuẩn
        const roomId = `guest_${user._id}`;
        const userRoom: UserRoom = {
          roomId,
          userName: user.full_name || user.email || 'Khách',
          userEmail: user.email,
          lastActivity: new Date(user.created_at || Date.now()),
          unreadCount: 0,
          userId: user._id
        };
        
        // MERGE với chat rooms nếu có
        if (roomsData.rooms && Array.isArray(roomsData.rooms)) {
          const chatRoom = roomsData.rooms.find((r: any) => {
            // 🔥 FIX: So sánh linh hoạt các format roomId
            const normalizedRoomId = r.roomId?.replace('guest_', '');
            const normalizedUserId = user._id?.toString();
            return normalizedRoomId === normalizedUserId || r.roomId === roomId;
          });
          if (chatRoom) {
            userRoom.lastActivity = new Date(chatRoom.at);
            userRoom.unreadCount = chatRoom.unreadCount || 0;
          }
        }
        
        rooms.push(userRoom);
      });
    }

    // 🔥 FIX: Xử lý rooms từ chat API
    if (roomsData.rooms && Array.isArray(roomsData.rooms)) {
      roomsData.rooms.forEach((room: any) => {
        // Kiểm tra room đã tồn tại chưa
        const exists = rooms.some(r => r.roomId === room.roomId);
        if (!exists) {
          rooms.push({
            roomId: room.roomId,
            userName: room.name || 'Khách',
            userEmail: '',
            lastActivity: new Date(room.at),
            unreadCount: room.unreadCount || 0,
            userId: room.roomId.replace('guest_', '')
          });
        }
      });
    }

    console.log("📋 Final rooms:", rooms.length);
    
    // Sắp xếp theo thời gian hoạt động gần nhất
    const sortedRooms = rooms.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    setUserRooms(sortedRooms);
    
    // Auto chọn room đầu tiên nếu chưa có
    if (!currentRoom && sortedRooms.length > 0) {
      console.log("🎯 Auto-selecting first room:", sortedRooms[0].roomId);
      setCurrentRoom(sortedRooms[0].roomId);
    }
    
  } catch (error) {
    console.error("❌ Error loading user rooms:", error);
  } finally {
    setIsLoading(false);
  }
}, [API_BASE]);
useEffect(() => {
  if (open) {
    console.log("🚀 Panel opened, loading rooms...");
    loadAllUserRooms();
    setBadge(0);
  }
}, [open, loadAllUserRooms]);
  // 🔥 Socket - CHỈ XỬ LÝ TIN NHẮN MỚI
useEffect(() => {
  if (!open) return;

  const s = getSocket();
  s.emit("join_support");
 const onReceiveForList = (m: { roomId?: string; text: string; name?: string; sender?: "guest"|"seller"|"bot"; createdAt?: string; }) => {
    if (!m.roomId || m.sender === "seller") return;
  
  console.log("📨 New message for room:", m.roomId, "current:", currentRoom, "sender:", m.name);
    
    // 🔥 FIX: Cập nhật room với logic chính xác hơn
    setUserRooms(prev => {
    const roomIndex = prev.findIndex(room => room.roomId === m.roomId);
      
      if (roomIndex >= 0) {
        // Room đã tồn tại - tạo mảng mới để tránh mutation
        const updated = [...prev];
        const currentRoomData = updated[roomIndex];
        const updatedRoom = {
        ...currentRoomData,
        lastActivity: new Date(),
        unreadCount: m.roomId === currentRoom ? 0 : currentRoomData.unreadCount + 1,
        // 🔥 FIX: Cập nhật tên từ tin nhắn nếu tin nhắn có tên và tên hiện tại là mặc định
        userName: m.name && m.name !== 'Khách' && currentRoomData.userName === 'Khách' 
          ? m.name 
          : currentRoomData.userName
      };
        updated[roomIndex] = updatedRoom;
      
      // Sắp xếp lại theo thời gian
      return updated.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      } else {
      // Room mới - thêm vào đầu danh sách
      const newRoom: UserRoom = {
        roomId: m.roomId!,
        userName: m.name || 'Khách', // 🔥 Sử dụng tên từ tin nhắn
        userEmail: m.name && m.name.includes('@') ? m.name : '', // Nếu là email
        lastActivity: new Date(),
        unreadCount: m.roomId === currentRoom ? 0 : 1,
        userId: m.roomId.replace('guest_', '')
      };
        
         return [newRoom, ...prev].sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }
  });

    if (m.roomId !== currentRoom && m.sender === "guest") {
    setBadge(prev => prev + 1);
  }
};

  s.off("support_inbox_update");
  s.on("support_inbox_update", onReceiveForList);

  return () => {
    s.off("support_inbox_update", onReceiveForList);
  };
}, [open, currentRoom]);
useEffect(() => {
  if (!open) {
    setCurrentRoom(null);
    setBadge(0);
    processedRooms.current.clear();
  }
}, [open]);
  // 🔥 Chọn room
  const onPickRoom = useCallback((rid: string) => {
  console.log("🎯 Switching to room:", rid);
  
  setCurrentRoom(rid);
    
    // Reset unread count cho room được chọn
    setUserRooms(prev => {
    const updated = prev.map(room => 
      room.roomId === rid 
        ? { ...room, unreadCount: 0 }
        : room
    );
    
    // Giữ nguyên thứ tự sắp xếp
    return updated.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  });
  
  setBadge(0);
}, []);
  // 🔥 Đóng/mở panel
  const handleTogglePanel = useCallback(() => {
    setOpen(prev => {
      const newState = !prev;
      if (newState) {
        loadAllUserRooms();
        setBadge(0);
      }
      return newState;
    });
  }, [loadAllUserRooms]);

  // 🔥 Refresh khi mở panel
  useEffect(() => {
    if (open) {
      loadAllUserRooms();
    }
  }, [open, loadAllUserRooms]);

  return (
    <>
      {/* Nút mở panel + badge */}
      <button
        onClick={handleTogglePanel}
        className="relative rounded-md bg-orange-500 px-4 py-2 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
      >
        💬 Hỗ trợ khách
        {badge > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white min-w-5 h-5 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[900px] max-w-[95vw] h-[600px] max-h-[80vh] rounded-2xl border bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex border-b p-4 justify-between items-center bg-orange-50 rounded-t-2xl">
            <div className="font-semibold text-gray-800 text-lg">
              💬 Hỗ trợ khách hàng ({userRooms.length})
              {isLoading && <span className="text-sm text-gray-500 ml-2">⟳ Đang tải...</span>}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800 text-lg"
            >
              ✖
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Danh sách khách hàng */}
            <aside className="w-1/3 border-r overflow-y-auto bg-gray-50">
              <div className="p-3 border-b bg-white">
                <input
                  type="text"
                  placeholder="🔍 Tìm khách hàng..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              {userRooms.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  {isLoading ? 'Đang tải...' : 'Chưa có khách hàng nào.'}
                </div>
              ) : (
                userRooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => onPickRoom(room.roomId)}
                    className={`block w-full text-left p-4 border-b hover:bg-white transition-colors ${
                      currentRoom === room.roomId 
                        ? "bg-white border-l-4 border-l-orange-500 shadow-sm" 
                        : "bg-gray-50"
                    } ${room.unreadCount > 0 ? "border-r-2 border-r-orange-400" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium text-gray-800 truncate flex-1">
                        {room.userName}
                      </div>
                      {room.unreadCount > 0 && (
                        <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-5 h-5 flex items-center justify-center ml-2">
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {room.userEmail || 'Khách'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {room.lastActivity.toLocaleDateString('vi-VN')} {room.lastActivity.toLocaleTimeString('vi-VN')}
                    </div>
                  </button>
                ))
              )}
            </aside>

            {/* Khung chat */}
            <main className="flex-1 flex flex-col">
              {currentRoom ? (
                <SellerChat 
                  key={currentRoom} 
                  roomId={currentRoom} 
                  onNewMessage={() => {
                    // Cập nhật last activity khi seller gửi tin
                    setUserRooms(prev => 
                      prev.map(room => 
                        room.roomId === currentRoom 
                          ? { ...room, lastActivity: new Date() }
                          : room
                      )
                    );
                  }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {userRooms.length > 0 ? 'Chọn một khách hàng để bắt đầu trò chuyện' : 'Không có khách hàng nào'}
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
}