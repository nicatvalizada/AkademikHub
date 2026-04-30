import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../../.env") });

function optionalApiKey(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  let s = String(v)
    .replace(/\uFEFF/g, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/^Bearer\s+/i, "").trim();
  return s.length > 0 ? s : undefined;
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET ən azı 16 simvol olmalıdır"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  OPENAI_API_KEY: z.preprocess(optionalApiKey, z.string().optional()),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_API_KEY: z.preprocess(optionalApiKey, z.string().optional()),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  DEEPSEEK_API_KEY: z.preprocess(optionalApiKey, z.string().optional()),
  DEEPSEEK_MODEL: z.string().default("deepseek-chat"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  SESSION_SECRET: process.env.SESSION_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
});
