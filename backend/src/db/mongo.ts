import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import config from "../config";

export async function connectMongo() {
  try {
    console.log("cwd =", process.cwd());
    console.log(".env exists?", fs.existsSync(path.resolve(process.cwd(), ".env")));
    console.log("MONGO_URI =", config.MONGO_URI);

    if (
      !config.MONGO_URI.startsWith("mongodb://") &&
      !config.MONGO_URI.startsWith("mongodb+srv://")
    ) {
      throw new Error("MONGO_URI invalid. Expect mongodb:// or mongodb+srv://");
    }

    await mongoose.connect(config.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
