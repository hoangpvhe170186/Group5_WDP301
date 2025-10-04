import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import chatRoutes from "./routes/chat"; // 👈 import route bạn vừa tạo

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Gắn router vào prefix /api
app.use("/api", chatRoutes);  // 👈 thêm dòng này

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

export default app;
