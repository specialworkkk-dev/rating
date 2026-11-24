import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in · Review Booster" };

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(homeFor(user));

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
      <p className="mt-1 mb-6 text-muted">Shop owners and admins</p>
      <LoginForm />
    </main>
  );
}
