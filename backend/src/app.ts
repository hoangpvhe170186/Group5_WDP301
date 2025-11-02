import cors from "cors";
import express from "express";
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
import orderRoutes from "./routes/order.route";
import orderTrackingRoute from "./routes/order-tracking.route"
import extraFeeRoutes from "./routes/extraFeeRoutes";
import adminRoute from "./routes/admin.route";
import driverInterviewRoutes from "./routes/driverInterview.route";
import notificationRoutes from "./routes/notification.route";
import carrierRoutes from "./routes/carrier.routes";
import sellerSalaryRoutes from "./routes/sellerSalary.routes";
// 👉 mới thêm
import feedbackRoute from "./routes/feedback.route";
import incidentsRoute from "./routes/incidents.route";
import payosWebhookRoute from "./routes/payos-webhook.route";
import pricePackageRoutes from "./routes/pricePackage.routes";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

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
app.use("/api/price-packages", pricePackageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/order-tracking", orderTrackingRoute);
app.use("/api/extrafees", extraFeeRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/admin", adminRoute);
app.use("/api/driver-interviews", driverInterviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/carrier", carrierRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 👉 mới mount
app.use("/api/feedback", feedbackRoute);
app.use("/api/incidents", incidentsRoute);

export default app;
