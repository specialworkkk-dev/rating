import { randomBytes } from "node:crypto";

export const DEVICE_COOKIE = "rb_did";
const DEVICE_RE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * The customer's device ID: the httpOnly cookie first, then the copy the page
 * keeps in localStorage (restores it if cookies were cleared), else a new one.
 */
export function resolveDeviceId(cookieJar, fromBody) {
  const fromCookie = cookieJar.get(DEVICE_COOKIE)?.value;
  if (fromCookie && DEVICE_RE.test(fromCookie)) return fromCookie;
  if (typeof fromBody === "string" && DEVICE_RE.test(fromBody)) return fromBody;
  return randomBytes(16).toString("base64url");
}

export function rememberDevice(cookieJar, deviceId) {
  cookieJar.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 400 * 24 * 60 * 60, // browsers cap cookies at 400 days
    path: "/",
  });
}
