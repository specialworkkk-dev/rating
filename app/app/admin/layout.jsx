import AppHeader from "@/components/AppHeader";
import PwaRegister from "@/components/PwaRegister";
import { appMetadata, appViewport } from "@/lib/appMeta";
import { requirePageRole } from "@/lib/session";

export const metadata = appMetadata;
export const viewport = appViewport;

export default async function AdminLayout({ children }) {
  const user = await requirePageRole("admin");
  return (
    <>
      <PwaRegister />
      <AppHeader title="Admin" user={user} links={[
          { href: "/app/admin", label: "Shops", activeFor: ["/app/admin/shops"], exact: true },
          { href: "/app/admin/services", label: "Services" },
        ]} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
