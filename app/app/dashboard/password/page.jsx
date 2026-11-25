import PasswordForm from "@/components/PasswordForm";
import { getOwnerContext } from "@/lib/ownerContext";

export const metadata = { title: "Change password" };

export default async function OwnerPasswordPage() {
  const { user } = await getOwnerContext();
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold">Change password</h1>
        <p className="mt-1 text-sm text-muted">For {user.email}</p>
      </div>
      <PasswordForm />
    </main>
  );
}
