// Creates the two free "VAPID" keys that sign offer notifications.
// Run once: node scripts/vapid-keys.mjs, then put the output in Vercel
// (VAPID_PRIVATE_KEY as a Secret) and in .env.local for local testing.
// Changing them later disconnects every follower, so keep them safe.
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\nVAPID_SUBJECT=mailto:you@example.com`);
