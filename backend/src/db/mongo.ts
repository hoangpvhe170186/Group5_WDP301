import mongoose from "mongoose";
import { config } from "../configs";

export async function connectMongo() {
  if (!/^mongodb(\+srv)?:\/\//.test(config.MONGO_URI)) {
    throw new Error("MONGO_URI invalid. Expect mongodb:// or mongodb+srv://");
  }
  await mongoose.connect(config.MONGO_URI);
  console.log("✅ MongoDB connected");
}
