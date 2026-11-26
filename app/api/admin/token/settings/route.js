import { bad, readJson } from "@/lib/http";
import { requireApiRole } from "@/lib/session";
import { getTokenSettings, setTokenSwitch, SWITCH_KEYS } from "@/lib/tokenSettings";

/**
 * Admin: flip a token switch. Body: { key, on, confirm? }.
 * "Lawyer & CA approved" can only be switched on by typing APPROVED.
 */
export async function PATCH(req) {
  const { user, error } = await requireApiRole("admin");
  if (error) return error;
  const { key, on, confirm } = await readJson(req);
  if (!SWITCH_KEYS.includes(key)) return bad("Unknown switch");
  if (typeof on !== "boolean") return bad("on must be true or false");
  if (key === "legalOk" && on && confirm !== "APPROVED") return bad("Type APPROVED to confirm your lawyer and CA have approved in writing");
  await setTokenSwitch(key, on, user.email);
  return Response.json({ ok: true, settings: await getTokenSettings() });
}
