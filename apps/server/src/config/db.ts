import mongoose from "mongoose";
import { env } from "./env.js";

const MAX_RETRIES = 5;
const RETRY_MS = 2000;

export async function connectDb(): Promise<void> {
  let attempt = 0;
  for (;;) {
    try {
      mongoose.set("strictQuery", true);
      await mongoose.connect(env.MONGODB_URI);
      console.info("[db] MongoDB qoşuldu");
      return;
    } catch (err) {
      attempt += 1;
      console.error(`[db] Qoşulma uğursuz (cəhd ${attempt}/${MAX_RETRIES})`, err);
      if (attempt >= MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, RETRY_MS));
    }
  }
}
