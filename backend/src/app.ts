import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import userRoutes from "./routes/user.route";
import uploadRoute from "./routes/upload.route";
import chatRoutes from "./routes/chat";
import pricingRoute from "./routes/pricing";
import vehiclesRoute from "./routes/vehicles.route";
import routes from "./routes/auth.route";
import carrierRoutes from "./routes/carrier.routes";
import orderRoutes from "./routes/order.route";
<<<<<<< HEAD
import {requireAuth} from "./middleware/requireAuth"
=======
import orderTrackingRoute from "./routes/order-tracking.route";

>>>>>>> 5cbb4ddceea1cd4d4b07fc9261e8fe67a4da1e8a
const app = express();

app.use(express.json());
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: [FRONTEND, "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length"]
}));

app.use(helmet());
app.use(morgan("dev"));
app.use("/api/carrier", carrierRoutes);
app.use("/api", uploadRoute); 

// ✅ Mount đúng thứ tự
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/carrier", carrierRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-tracking", orderTrackingRoute);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", routes);

// ✅ Test
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

<<<<<<< HEAD
app.use("/api", routes);

// User routes
app.use("/api/users", requireAuth,userRoutes);
app.use("/api/upload",requireAuth, uploadRoute);
app.use("/api/chat", requireAuth,chatRoutes);
app.use("/api/pricing", requireAuth,pricingRoute);
app.use("/api/vehicles", requireAuth,vehiclesRoute);
app.use("/api/orders", requireAuth,orderRoutes);
app.use("/api/carrier", requireAuth,carrierRoutes);

=======
>>>>>>> 5cbb4ddceea1cd4d4b07fc9261e8fe67a4da1e8a
export default app;
