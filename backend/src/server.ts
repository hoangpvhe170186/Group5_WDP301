import { connectMongo } from "./db/mongo";
import { config } from "./config";
import app from "./app";

async function start() {
  try {
    await connectMongo();
    app.listen(config.PORT, () => {
      console.log(`🚀 API ready at http://localhost:${config.PORT}`);
    });
  } catch (err) {
    console.error("❌ Boot error:", err);
    process.exit(1);
  }
}
start();
