// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import userRoutes from "./routes/user.route";
import uploadRoute from "./routes/upload.route";
import chatRoutes from "./routes/chat";        // nếu bạn có REST cho chat
import pricingRoute from "./routes/pricing";
import vehiclesRoute from "./routes/vehicles.route";
import authRoutes from "./routes/auth.route";
import orderRoutes from "./routes/order.route";
import carrierRoutes from "./routes/carrier.routes";

const app = express();

// middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));   // quan trọng để POST JSON tạo đơn không 500
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (_req, res) => res.send("🚀 Backend running..."));
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoutes);
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/carriers", carrierRoutes);

export default app;
