import "./loadEnv";
import { createServer } from "http";
import app from "./app";
import { connectMongo } from "./db/mongo";
import { config } from "./config";
import { getIO, initRealtime } from "./realtime";

async function start() {
  await connectMongo(); // ✅ Kết nối DB trước

  // 👉 Chỉ import cron job sau khi MongoDB đã connect
  await import("./services/autoAssignJob");

  const server = createServer(app);
  initRealtime(server);
  // Middleware để gắn io vào req
  app.use((req, res, next) => {
    (req as any).io = getIO();
    next();
  });

  const PORT = Number(config.PORT) || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 API & Socket ready at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("💥 Boot error:", err);
  process.exit(1);
});
