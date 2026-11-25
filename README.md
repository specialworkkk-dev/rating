# Review Booster

QR / NFC rating pages for local shops. See [MASTER.md](MASTER.md) for the full plan.

## Run locally

```bash
npm install                      # npm cache is kept in ./.npm-cache (see .npmrc)
cp .env.example .env.local       # then set MONGODB_URI
npm run db:dev                   # optional: local MongoDB in ./.data (no Docker needed)
npm run seed                     # creates the demo shop
npm run create-admin -- you@example.com 'a-strong-password' "Your Name"
npm run dev                      # open http://localhost:3000/login
```

## Pages

| Page | Who | What |
|---|---|---|
| `/r/<slug>` | Customer | Rate the shop → Google button (4–5★) or private feedback (1–3★) |
| `/login` | Owner / admin | Email + password (Auth.js); 10 attempts per 15 min |
| `/dashboard` | Owner | Scans, ratings, average, breakdown, Google clicks, feedback with unread badge, QR poster |
| `/admin` | Admin | All shops, revenue summary, add / edit shops, owner logins, mark paid, pause, QR poster |

**QR poster:** `GET /api/dashboard/qr` (owner) or `/api/admin/shops/<id>/qr` (admin), with
`format=pdf|png|qr`, `size=a4|a5|a6` (PDF only) and `preview=1` for a small PNG. Rendered with
`next/og` using the Geist fonts in [assets/fonts](assets/fonts).

Logo upload needs the `CLOUDINARY_*` keys in `.env.local`; without them, paste a logo URL instead.

`npm run db:dev` listens on port 27017 by default (`DEV_DB_PORT` to change it).
Add `?src=nfc` to a rating link to count the scan as an NFC tap.

## Anti-spam rules

- **One rating per device per shop.** A random device ID lives in an httpOnly cookie (400 days) with a
  backup copy in localStorage. Rating again updates the same rating, like editing a Google review.
- **Every complaint is kept.** One feedback entry per device per shop per day; a second message the
  same day is appended to it (no second alert). Feedback can only be attached to your own rating.
- **IP addresses are never stored**, only a keyed hash (`IP_HASH_SECRET`, falls back to `AUTH_SECRET`),
  used for burst limits and to flag "many ratings from one network within an hour" in admin.
- **Rate limits live in MongoDB** (`ratelimits`, auto-expiring), so they hold across serverless instances.
- After changing indexes in `models/`, run `npm run migrate` (and against production with
  `MONGODB_URI=... npm run migrate`) **before** deploying.

## Build progress (MASTER.md §13)

- [x] Day 1 — setup, cached MongoDB connection, models, Tailwind
- [x] Day 2 — rating page, rating / feedback / scan / Google-click APIs, rate limiting
- [x] Day 3 — admin panel (shops, Place ID, logo, owner logins, paid / paused)
- [x] Day 4 — auth + owner dashboard (stats, feedback list, unread badge)
- [x] Day 5a — QR poster (PDF A4 / A5 / A6, PNG, QR only, NFC link)
- [ ] Day 5b — email alerts (Resend)
- [ ] Day 6 — PWA + push alerts
- [ ] Day 7 — testing on phones, deploy
