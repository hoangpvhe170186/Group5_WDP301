import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";

import userRoutes from "./routes/user.route";
import uploadRoute from "./routes/upload.route";
import chatRoutes from "./routes/chat";
import pricingRoute from "./routes/pricing";
import vehiclesRoute from "./routes/vehicles.route";
import authRoutes from "./routes/auth.route";
import carrierRoutes from "./routes/carrier.routes";
import orderRoutes from "./routes/order.route";
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 308a323ff3a9a5af3d56c8912cb77cb74c444f79
import orderTrackingRoute from "./routes/order-tracking.route";
import extraFeeRoutes from "./routes/extraFeeRoutes";

// 👉 mới thêm
import feedbackRoute from "./routes/feedback.route";
import incidentsRoute from "./routes/incidents.route";

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

<<<<<<< HEAD
=======
import {requireAuth} from "./middleware/requireAuth"
import orderTrackingRoute from "./routes/order-tracking.route"
>>>>>>> long
=======
>>>>>>> 308a323ff3a9a5af3d56c8912cb77cb74c444f79
const app = express();

// CORS cho cookie
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// cho phép hiển thị ảnh tĩnh
app.use("/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);

app.get("/", (_req, res) => res.send("🚀 Backend running..."));

// ===== Mount routes =====
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/order-tracking", orderTrackingRoute);
app.use("/api/extrafees", extraFeeRoutes);
app.use("/api/upload", uploadRoute);

<<<<<<< HEAD
<<<<<<< HEAD
app.get("/", (_req, res) => res.send("🚀 Backend running..."));
=======
// ✅ Test
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});
>>>>>>> long

app.use("/api", routes);

// User routes
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoutes);
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles",vehiclesRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/carrier",carrierRoutes);
=======
// 👉 mới mount
app.use("/api/feedback", feedbackRoute);
app.use("/api/incidents", incidentsRoute);
>>>>>>> 308a323ff3a9a5af3d56c8912cb77cb74c444f79

export default app;
