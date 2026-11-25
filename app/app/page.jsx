import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/session";

/** /app: send people to their home (owner dashboard or admin), or to log in. */
export default async function AppHome() {
  const user = await currentUser();
  redirect(user ? homeFor(user) : "/app/login");
}
