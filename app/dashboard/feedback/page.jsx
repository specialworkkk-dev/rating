import AppHeader from "@/components/AppHeader";
import FeedbackList from "@/components/FeedbackList";
import PausedNotice from "@/components/PausedNotice";
import { card } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { ownerLinks } from "@/lib/ownerNav";
import { requirePageRole } from "@/lib/session";
import { pauseReason } from "@/lib/shop";
import { getFeedbackPage } from "@/lib/stats";
import Shop from "@/models/Shop";

export const metadata = { title: `Feedback · ${BRAND.name}` };

/** Page 2 for owners: the private complaints inbox. */
export default async function FeedbackPage() {
  const user = await requirePageRole("owner");
  const shop = user.shopId ? await Shop.findById(user.shopId).lean() : null;
  if (!shop) {
    return (
      <>
        <AppHeader user={user} />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className={card}>Your account isn’t linked to a shop yet. Please contact support.</p>
        </main>
      </>
    );
  }

  const paused = pauseReason(shop);
  if (paused) {
    return (
      <>
        <AppHeader user={user} shop={shop} showBell={false} />
        <main className="px-4 py-10 sm:py-16">
          <PausedNotice reason={paused} shopName={shop.name} endedAt={shop.status === "trial" ? shop.trialEndsAt : shop.paidUntil} />
        </main>
      </>
    );
  }

  const feedback = await getFeedbackPage(shop._id);
  return (
    <>
      <AppHeader user={user} shop={shop} badge={feedback.counts.unread} links={ownerLinks(feedback.counts.unread)} />
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
    </>
  );
}
