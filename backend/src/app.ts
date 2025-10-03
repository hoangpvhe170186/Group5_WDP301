import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import userRoutes from "./routes/user.route";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

// User routes
app.use("/api/users", userRoutes);

export default app;
 