import { createHmac } from "node:crypto";
import { connectDB } from "@/lib/db";
import RateLimit from "@/models/RateLimit";

// Rate limits are stored in MongoDB so they hold across every serverless
// instance (an in-memory counter only sees one instance's traffic).

export function getClientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * A keyed hash of the IP. The raw IP is never stored; the hash still lets us
 * group "many ratings from the same network".
 */
export function hashIp(ip) {
  const secret = process.env.IP_HASH_SECRET || process.env.AUTH_SECRET || "dev-secret";
  return createHmac("sha256", secret).update(String(ip)).digest("base64url").slice(0, 22);
}

/**
 * Fixed-window counter.
 * @returns {Promise<{ ok: boolean, retryAfter: number }>} retryAfter in seconds
 */
export async function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const retryAfter = Math.ceil((windowStart + windowMs - now) / 1000);
  const id = `${key}:${windowStart}`;

  try {
    await connectDB();
    let doc;
    try {
      doc = await RateLimit.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
        { upsert: true, returnDocument: "after", lean: true }
      );
    } catch (err) {
      if (err?.code !== 11000) throw err;
      // Two requests created the window at the same moment; the retry increments it.
      doc = await RateLimit.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: "after", lean: true });
    }
    return { ok: doc.count <= limit, retryAfter };
  } catch (err) {
    // Never block real customers because the limiter itself failed.
    console.error("[rateLimit] failed, allowing request", err?.message);
    return { ok: true, retryAfter: 0 };
  }
}

/** Run several limits; returns the first one that is exceeded, or null. */
export async function firstExceeded(checks) {
  const results = await Promise.all(checks.map(([key, opts]) => rateLimit(key, opts)));
  return results.find((r) => !r.ok) || null;
}

export function tooMany(retryAfter, message = "Too many requests. Please try again later.") {
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
