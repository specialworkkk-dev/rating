import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * The signed-in user, freshly loaded from the DB so that role and shop
 * changes (or a deleted account) take effect immediately, not at token expiry.
 */
export async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  await connectDB();
  return User.findById(id).select("-passwordHash").lean();
}

/** For pages: redirect to /login (or the right home) unless the role matches. */
export async function requirePageRole(role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homeFor(user));
  return user;
}

/** For API routes: returns { user } or { error: Response }. */
export async function requireApiRole(role) {
  const user = await currentUser();
  if (!user) return { error: Response.json({ error: "Not signed in" }, { status: 401 }) };
  if (user.role !== role) return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  if (role === "owner" && !user.shopId) {
    return { error: Response.json({ error: "No shop linked to this account" }, { status: 403 }) };
  }
  return { user };
}

export function homeFor(user) {
  return user?.role === "admin" ? "/admin" : "/dashboard";
}
