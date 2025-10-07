import http from "http";
import { connectMongo } from "./db/mongo";
import { config } from "./config";
import app from "./app";
import { createSocketServer } from "./realtime/socket"; 

async function start() {
  const server = http.createServer(app);
  createSocketServer(server); // khởi tạo Socket.IO bám vào server

  try {
    await connectMongo();
    server.listen(config.PORT, () => {   // DÙNG server.listen
      console.log(`🚀 API ready at http://localhost:${config.PORT}`);
    });
  } catch (err) {
    console.error("❌ Boot error:", err);
    process.exit(1);
  }
}
start();
