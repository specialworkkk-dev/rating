// Simple fixed-window, in-memory rate limiter keyed by IP.
// Note: on serverless each instance has its own memory, so this is a
// best-effort spam brake, not a hard guarantee. Swap for Redis/Upstash later.
const buckets = new Map();
let lastSweep = Date.now();

export function getClientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * @returns {{ ok: boolean, retryAfter: number }} retryAfter in seconds
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();

  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastSweep = now;
  }

  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;

  return {
    ok: b.count <= limit,
    retryAfter: Math.ceil((b.resetAt - now) / 1000),
  };
}

export function tooMany(retryAfter) {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
