import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});
