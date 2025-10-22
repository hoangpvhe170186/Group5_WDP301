import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import userRoutes from "./routes/user.route";
import uploadRoute from "./routes/upload.route";
import chatRoutes from "./routes/chat";
import pricingRoute from "./routes/pricing";
import vehiclesRoute from "./routes/vehicles.route";
import routes from "./routes/auth.route";
import carrierRoutes from "./routes/carrier.routes";
import orderRoutes from "./routes/order.route";
<<<<<<< HEAD
import orderTrackingRoute from "./routes/order-tracking.route";
import fs from "fs";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

=======
import {requireAuth} from "./middleware/requireAuth"
import orderTrackingRoute from "./routes/order-tracking.route"
>>>>>>> long
const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // ✅ Cho phép ảnh hiển thị ở tab riêng
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); // ✅ Tránh Chrome chặn
  next();
});

app.use(helmet());
app.use(morgan("dev"));

// 👉 Serve static files (ảnh/video đã upload)
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // ✅ Cho phép ảnh được load từ FE
  next();
}, express.static(path.join(process.cwd(), "uploads")));

// Mount routes
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/carrier", carrierRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-tracking", orderTrackingRoute);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", routes);

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

export default app;
