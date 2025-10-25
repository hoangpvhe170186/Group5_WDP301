// realtime.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    if (!socket.connected && !socket.active) socket.connect();
    return socket;
  }
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
    // Cho phép fallback polling (tránh mất realtime sau khi đóng/mở panel)
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    autoConnect: true,
  });
  return socket;
}

export function closeSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
