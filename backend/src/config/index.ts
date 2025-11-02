import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev",
  JWT_EXPIRES: process.env.JWT_EXPIRES || "7d",
};
