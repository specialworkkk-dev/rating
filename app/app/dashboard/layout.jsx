import AppHeader from "@/components/AppHeader";
import PwaRegister from "@/components/PwaRegister";
import { appMetadata, appViewport } from "@/lib/appMeta";
import { getOwnerContext } from "@/lib/ownerContext";
import { ownerLinks } from "@/lib/ownerNav";
import Feedback from "@/models/Feedback";

export const metadata = appMetadata;
export const viewport = appViewport;

/**
 * Shared by Dashboard and Feedback: the header stays on screen while only the
 * page below changes (with an instant loading skeleton).
 */
export default async function OwnerLayout({ children }) {
  const { user, shop, paused } = await getOwnerContext();
  const live = shop && !paused;
  const unread = live ? await Feedback.countDocuments({ shopId: shop._id, isRead: false }) : 0;

  return (
    <>
      <PwaRegister />
      <AppHeader user={user} shop={shop} badge={unread} links={live ? ownerLinks(unread) : []} showBell={Boolean(live)} />
      {children}
    </>
  );
}
