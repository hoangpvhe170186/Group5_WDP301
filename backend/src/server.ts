import 'dotenv/config';         
import app from "./app";
import { connectMongo } from "./db/mongo";
import config from "./config";

async function start() {
  await connectMongo();
  app.listen(config.PORT, () => {
    console.log(`🚀 Server http://localhost:${config.PORT}`);
  });
}
start();
