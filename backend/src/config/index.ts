// src/config/index.ts
import path from "path";
import dotenv from "dotenv";

// Ép load .env từ thư mục chạy (backend/.env)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Loại dấu ngoặc/space vô tình dán vào
const clean = (s?: string) => (s ?? "").replace(/^['"]|['"]$/g, "").trim();

const config = {
  MONGO_URI: clean(process.env.MONGO_URI),
  PORT: clean(process.env.PORT) || "5000",
  JWT_SECRET: clean(process.env.JWT_SECRET) || "changeme",
};

export default config;
