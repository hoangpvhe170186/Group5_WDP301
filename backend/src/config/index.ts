import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev",
  JWT_EXPIRES: process.env.JWT_EXPIRES || "7d",
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID || "4e0a2092-8d14-4816-a67b-92acf0740044",
  PAYOS_API_KEY: process.env.PAYOS_API_KEY || "e52d25e0-9b1a-4eac-a725-ea34c3312586",
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || "f5a3c486afdce71ba04979ebf1c182445eee74329cbcbc681d258b27ab2e08bf",
};
