import "./loadEnv";
import { createServer } from "http";
import app from "./app";
import { connectMongo } from "./db/mongo";
import { config } from "./config";
import { initRealtime } from "./realtime";

async function start() {
  await connectMongo(); // chỉ kết nối DB 1 lần trước khi start server

  const server = createServer(app); // HTTP server chứa luôn Express
  initRealtime(server);             // gắn Socket.IO vào cùng server

  const PORT = Number(config.PORT) || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 API & Socket ready at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("💥 Boot error:", err);
  process.exit(1);
});
