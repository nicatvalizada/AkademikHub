import type { Request, RequestHandler } from "express";
import { fail } from "../utils/apiResponse.js";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  max: number;
  windowMs: number;
  key?: (req: Request) => string;
};

const buckets = new Map<string, Bucket>();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);

cleanup.unref?.();

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function emailKey(req: Request): string {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return email ? `${clientIp(req)}:${email}` : clientIp(req);
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${options.key?.(req) ?? clientIp(req)}`;
    const current = buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      fail(
        res,
        429,
        "Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.",
        "RATE_LIMITED",
      );
      return;
    }

    next();
  };
}

export const authRateLimit = createRateLimit({
  keyPrefix: "auth",
  key: emailKey,
  max: 20,
  windowMs: 15 * 60 * 1000,
});

export const aiRateLimit = createRateLimit({
  keyPrefix: "ai",
  max: 30,
  windowMs: 60 * 60 * 1000,
});
