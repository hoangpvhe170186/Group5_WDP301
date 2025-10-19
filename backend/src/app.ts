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

app.use("/api", chatRoutes);  


app.use("/api/pricing", pricingRoute);     
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/carrier", carrierRoutes); 

app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

app.use("/api", routes);

// User routes
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoutes);
app.use("/api/pricing", pricingRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/carrier", carrierRoutes);

export default app;
