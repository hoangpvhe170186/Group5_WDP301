import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import chatRoutes from "./routes/chat"; // 👈 import route bạn vừa tạo
import routes from "./routes/index";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Gắn router vào prefix /api
app.use("/api", chatRoutes);  // 👈 thêm dòng này
app.use("/api", routes);

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

export default app;
