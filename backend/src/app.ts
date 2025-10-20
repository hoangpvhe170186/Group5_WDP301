import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import userRoutes from "./routes/user.route";
import uploadRoute from "./routes/upload.route";
import chatRoutes from "./routes/chat"; // 👈 import route bạn vừa tạo
import pricingRoute from "./routes/pricing";  
import vehiclesRoute from "./routes/vehicles.route";
import routes from "./routes/auth.route";
import carrierRoutes from "./routes/carrier.routes"; // ✅ THÊM DÒNG NÀY
import orderRoutes from "./routes/order.route";
import {requireAuth} from "./middleware/requireAuth"
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Gắn router vào prefix /api
app.use("/api", chatRoutes);  // 👈 thêm dòng này

// mount API routes
app.use("/api/pricing", pricingRoute);      // <-- mount pricing routes
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/carrier", carrierRoutes); // ✅ Ở đây
// Test route
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

app.use("/api", routes);

// User routes
app.use("/api/users", requireAuth,userRoutes);
app.use("/api/upload",requireAuth, uploadRoute);
app.use("/api/chat", requireAuth,chatRoutes);
app.use("/api/pricing", requireAuth,pricingRoute);
app.use("/api/vehicles", requireAuth,vehiclesRoute);
app.use("/api/orders", requireAuth,orderRoutes);
app.use("/api/carrier", requireAuth,carrierRoutes);

export default app;
