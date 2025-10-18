import dotenv from "dotenv";
dotenv.config();
if (!process.env.MAPBOX_TOKEN) {
  console.error("❌ MAPBOX_TOKEN is missing. Check backend/.env");
} else {
  console.log("✅ MAPBOX_TOKEN prefix:", process.env.MAPBOX_TOKEN.slice(0, 6));
}
