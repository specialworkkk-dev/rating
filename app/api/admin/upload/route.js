import { cloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { bad } from "@/lib/http";
import { requireApiRole } from "@/lib/session";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(req) {
  const { error } = await requireApiRole("admin");
  if (error) return error;

  if (!cloudinaryConfigured()) {
    return bad("Logo upload isn’t set up yet (Cloudinary keys missing). Paste a logo URL instead.", 503);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return bad("No file uploaded");
  if (!TYPES.includes(file.type)) return bad("Logo must be PNG, JPG, WebP or SVG");
  if (file.size > MAX_BYTES) return bad("Logo must be under 2 MB");

  try {
    return Response.json({ url: await uploadImage(file) });
  } catch (err) {
    console.error("[upload]", err);
    return bad("Upload failed. Please try again.", 502);
  }
}
