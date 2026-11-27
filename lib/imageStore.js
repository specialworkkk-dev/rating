// Offer photos. Stored on Cloudflare R2 (S3-compatible, generous free tier,
// served from Cloudflare's network) when its keys are set; otherwise on
// Cloudinary if that is set up; otherwise uploads are refused with a clear
// message. No SDK: R2 uploads are signed here with AWS Signature V4.
//
// R2 settings (Vercel → Environment Variables):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (Secret),
//   R2_BUCKET, R2_PUBLIC_URL (e.g. https://pub-xxxx.r2.dev, no trailing slash)
//   R2_ENDPOINT (optional, only for other S3-compatible storage or tests)
import { createHash, createHmac } from "node:crypto";
import { cloudinaryConfigured, uploadImage as cloudinaryUpload } from "@/lib/cloudinary";

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const encodePath = (p) => p.split("/").map((s) => encodeURIComponent(s)).join("/");

/**
 * AWS Signature V4 headers for one request (exported for the test against
 * AWS's published example). `headers` must include host; names lowercase.
 */
export function signV4({ method, host, path, query = "", headers, payloadHash, accessKeyId, secretAccessKey, region, service = "s3", amzDate }) {
  const all = { ...headers, host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const names = Object.keys(all).map((n) => n.toLowerCase()).sort();
  const canonicalHeaders = names.map((n) => `${n}:${String(all[n]).trim()}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), service), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return {
    ...all,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

const r2 = () => {
  const e = process.env;
  const ok = e.R2_ACCOUNT_ID && e.R2_ACCESS_KEY_ID && e.R2_SECRET_ACCESS_KEY && e.R2_BUCKET && e.R2_PUBLIC_URL;
  // R2_ENDPOINT (optional): another S3-compatible address, also used for tests.
  const endpoint = (e.R2_ENDPOINT || `https://${(e.R2_ACCOUNT_ID || "").trim()}.r2.cloudflarestorage.com`).replace(/\/+$/, "");
  return ok
    ? {
        endpoint,
        host: new URL(endpoint).host,
        bucket: e.R2_BUCKET.trim(),
        accessKeyId: e.R2_ACCESS_KEY_ID.trim(),
        secretAccessKey: e.R2_SECRET_ACCESS_KEY.trim(),
        publicUrl: e.R2_PUBLIC_URL.trim().replace(/\/+$/, ""),
      }
    : null;
};

/** Which store is in use: "r2", "cloudinary" or null (uploads off). */
export const imageStore = () => (r2() ? "r2" : cloudinaryConfigured() ? "cloudinary" : null);

// S3 query strings are signed in sorted, strictly encoded form.
const encodeQ = (v) => encodeURIComponent(v).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);

async function r2Request(method, key, body, contentType, query = null) {
  const c = r2();
  const path = key == null ? `/${c.bucket}` : `/${c.bucket}/${encodePath(key)}`;
  const qs = query
    ? Object.keys(query)
        .sort()
        .map((k) => `${encodeQ(k)}=${encodeQ(query[k])}`)
        .join("&")
    : "";
  const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const payloadHash = sha256(body || "");
  const headers = signV4({
    method,
    host: c.host,
    path,
    query: qs,
    headers: contentType ? { "content-type": contentType } : {},
    payloadHash,
    accessKeyId: c.accessKeyId,
    secretAccessKey: c.secretAccessKey,
    region: "auto",
    amzDate,
  });
  delete headers.host; // fetch sets it
  const res = await fetch(`${c.endpoint}${path}${qs ? `?${qs}` : ""}`, { method, headers, body: body || undefined });
  if (!res.ok && !(method === "DELETE" && res.status === 404)) {
    throw new Error(`Photo storage answered ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  return res;
}

/** Every stored object under a prefix: [{ key, lastModified }] (R2 only). */
async function listImages(prefix) {
  const out = [];
  let token = null;
  do {
    const res = await r2Request("GET", null, null, null, { "list-type": "2", prefix, ...(token ? { "continuation-token": token } : {}) });
    const xml = await res.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = m[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1];
      const lm = m[1].match(/<LastModified>([\s\S]*?)<\/LastModified>/)?.[1];
      if (key) out.push({ key: key.replace(/&amp;/g, "&"), lastModified: lm ? new Date(lm) : new Date() });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] : null;
  } while (token);
  return out;
}

/**
 * Nightly: delete uploaded offer photos that never became part of a sent
 * offer (removed or abandoned drafts) once they are a day old.
 * `inUse` is a Set of photo URLs still used by offers.
 */
export async function deleteUnusedOfferPhotos(inUse, olderThanMs = 24 * 3_600_000) {
  if (!r2()) return { checked: 0, deleted: 0 };
  const c = r2();
  const cutoff = Date.now() - olderThanMs;
  let deleted = 0;
  const all = await listImages("offers/");
  for (const o of all) {
    const url = `${c.publicUrl}/${encodePath(o.key)}`;
    if (o.lastModified.getTime() < cutoff && !inUse.has(url)) {
      await r2Request("DELETE", o.key);
      deleted += 1;
    }
  }
  return { checked: all.length, deleted };
}

/** Store a photo; returns its public URL. `key` like "offers/<shopId>/<name>.jpg". */
export async function putImage(key, bytes, contentType) {
  if (r2()) {
    await r2Request("PUT", key, bytes, contentType);
    return `${r2().publicUrl}/${encodePath(key)}`;
  }
  if (cloudinaryConfigured()) {
    const folder = key.split("/").slice(0, -1).join("/");
    return cloudinaryUpload(new Blob([bytes], { type: contentType }), { folder: `review-booster/${folder}` });
  }
  throw new Error("Photo uploads aren’t set up yet.");
}

/** The R2 key of a URL we created, or null (other URLs are never touched). */
export function keyFromUrl(url) {
  const c = r2();
  if (!c || typeof url !== "string" || !url.startsWith(`${c.publicUrl}/`)) return null;
  return decodeURIComponent(url.slice(c.publicUrl.length + 1));
}

/** Best-effort delete of a photo we stored on R2. */
export async function deleteImage(url) {
  const key = keyFromUrl(url);
  if (!key) return;
  await r2Request("DELETE", key).catch((err) => console.error("[images] delete failed", err?.message));
}

/** Whether a URL is one of this shop's uploaded offer photos (so owners can't point offers at any image). */
export function isShopOfferImage(url, shopId) {
  if (typeof url !== "string" || !url) return false;
  const c = r2();
  if (c) return url.startsWith(`${c.publicUrl}/offers/${shopId}/`);
  return /^https:\/\/res\.cloudinary\.com\//.test(url) && url.includes(`/review-booster/offers/${shopId}/`);
}
