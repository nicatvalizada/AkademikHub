import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

await connectDb();
const app = createApp();

app.listen(env.PORT, () => {
  console.info(`[server] http://localhost:${env.PORT}`);
});
