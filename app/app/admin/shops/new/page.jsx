import Link from "next/link";
import ShopForm from "@/components/ShopForm";

export const metadata = { title: "Add shop · Admin" };

export default function NewShopPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/app/admin" className="inline-block text-sm text-stone-600 hover:text-ink">
        ← All shops
      </Link>
      <ShopForm />
    </div>
  );
}
