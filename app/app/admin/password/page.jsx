import PasswordForm from "@/components/PasswordForm";
import { requirePageRole } from "@/lib/session";

export const metadata = { title: "Change password · Admin" };

export default async function AdminPasswordPage() {
  const user = await requirePageRole("admin");
  return (
    <div className="mx-auto max-w-md space-y-4 py-2">
      <div>
        <h1 className="text-xl font-bold">Change password</h1>
        <p className="mt-1 text-sm text-muted">For {user.email}</p>
      </div>
      <PasswordForm />
    </div>
  );
}
