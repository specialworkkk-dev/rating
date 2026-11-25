import FeedbackList from "@/components/FeedbackList";
import PausedNotice from "@/components/PausedNotice";
import { card } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { getOwnerContext } from "@/lib/ownerContext";
import { getFeedbackPage } from "@/lib/stats";

export const metadata = { title: `Feedback · ${BRAND.name}` };

/** Page 2 for owners: the private complaints inbox. */
export default async function FeedbackPage() {
  const { shop, paused } = await getOwnerContext();
  if (!shop) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className={card}>Your account isn’t linked to a shop yet. Please contact support.</p>
      </main>
    );
  }
  if (paused) {
    return (
      <main className="px-4 py-10 sm:py-16">
        <PausedNotice reason={paused} shopName={shop.name} endedAt={shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil} />
      </main>
    );
  }

  const feedback = await getFeedbackPage(shop._id);
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Private feedback</h1>
        <p className="mt-1 text-sm text-muted md:text-base">
          <span className="md:hidden">From customers who rated 1–3★. Only you can see them.</span>
          <span className="hidden md:inline">
            Messages from customers who rated you 1–3★. Only you can see them. Call or WhatsApp them to put things right.
          </span>
        </p>
      </div>
      <FeedbackList initial={feedback} />
    </main>
  );
}
