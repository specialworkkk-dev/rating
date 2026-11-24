// Bad-rating alerts. Email (Resend) lands on build day 5 and push (FCM) on
// day 6; until then this logs so the flow can be tested end to end.
export async function notifyBadRating({ shop, feedback }) {
  console.info(
    `[alert] ${feedback.stars}★ feedback for "${shop.name}" (${shop.slug}): ${feedback.message.slice(0, 80)}`
  );
}
