import { createHash } from "node:crypto";

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/** Signed upload via Cloudinary's REST API (no SDK needed). Returns the https URL. */
export async function uploadImage(file, { folder = "review-booster/logos" } = {}) {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } =
    process.env;

  const timestamp = Math.floor(Date.now() / 1000);
  // Params must be sorted alphabetically before signing.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + secret).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", key);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Cloudinary upload failed (${res.status})`);
  return json.secure_url;
}
