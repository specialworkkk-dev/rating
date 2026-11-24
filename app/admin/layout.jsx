import AppHeader from "@/components/AppHeader";
import { requirePageRole } from "@/lib/session";

export default async function AdminLayout({ children }) {
  const user = await requirePageRole("admin");
  return (
    <>
      <AppHeader title="Admin" user={user} links={[{ href: "/admin", label: "Shops" }]} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
