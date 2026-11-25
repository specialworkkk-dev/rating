"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";

export async function login(_prev, formData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error:
          err.code === "too_many_attempts"
            ? "Too many attempts. Please wait 15 minutes and try again."
            : "Wrong email or password.",
      };
    }
    throw err;
  }
  // /dashboard sends admins on to /admin.
  redirect("/app/dashboard");
}

export async function logout() {
  await signOut({ redirectTo: "/app/login" });
}

/** After a password change: end this login too, then show a note on the login page. */
export async function logoutAfterPasswordChange() {
  await signOut({ redirectTo: "/app/login?changed=1" });
}
