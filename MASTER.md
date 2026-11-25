# Review Booster: Master Plan

> A QR / NFC-based web app that helps local shops get more Google reviews and catch unhappy customers privately.
> Goal: **₹5000/day (≈ ₹1.5 lakh/month)** from monthly subscriptions.
> (Working name. Change it before launch.)

---

## 1. The Idea in One Line

A shop puts a QR standee on the counter. The customer scans it and rates the shop. Happy customers get a one-tap link to Google's review box. Unhappy customers can send private feedback to the owner (but can still post on Google).

**Why shops pay:** more Google reviews mean a higher rank on Google Maps and more walk-in customers. Private complaints let the owner fix problems before they become 1-star reviews.

---

## 2. Business Model

### Pricing

| Item | Our cost | Price to shop |
|---|---|---|
| Monthly plan | ~₹0 | **₹499/month** |
| Printed QR standee (setup) | ₹100–150 | ₹499 one-time |
| NFC tap card (add-on) | ₹80–120 | ₹499–799 |
| WhatsApp alerts (future premium) | ~₹0.12–0.15/message | ₹699/month plan |

### Revenue target

| Shops paying ₹499/month | Monthly revenue | Per day |
|---|---|---|
| 20 | ₹10,000 | ₹333 |
| 100 | ₹49,900 | ₹1,663 |
| 200 | ₹99,800 | ₹3,327 |
| **300** | **₹1,49,700** | **≈ ₹5,000** |

Setup fees and NFC cards come on top of this.

### Milestones

1. **First 5 shops** use it free, to prove it works and collect testimonials
2. **₹500/day**: about 30 paying shops
3. **₹2,500/day**: about 150 paying shops
4. **₹5,000/day**: about 300 paying shops (realistic timeline: 6–18 months)

---

## 3. ⚠️ Google Policy Rules (must follow)

1. **No review gating.** Every customer gets the **same "Post on Google" button**, whatever they rated. Unhappy customers *additionally* get a private feedback form, shown alongside the button, never instead of it. (A big button for happy customers and a small link for unhappy ones still counts as selective solicitation.)
2. **No fake reviews.** Never write, generate or pay for reviews.
3. **No AI-written reviews.** Customers write their own words.
4. **No incentives for reviews.** Don't offer a discount or gift in exchange for a review.

5. **Neutral wording.** Posters and pages ask "How was your visit?", never "Liked our service?" or "Rate us 5 stars".
6. **Shop owners agree to the fair-review rules** (ask every customer, no rewards, no staff/family reviews, customers use their own phone, no telling customers what to write). The app records when they agreed.

If a shop breaks these rules, Google can remove its reviews. Sell the product as "**make reviewing easy + catch complaints early**", never as "block bad reviews" or "stop negative reviews". This applies everywhere: website, WhatsApp messages, Instagram posts and face-to-face pitches, because Google and competitors can see them.

---

## 4. User Flow

```
Customer pays bill
        ↓
Sees QR standee / NFC card: "How was your visit? Scan & rate us ⭐"
        ↓
Scans → opens yoursite.com/r/<shop-slug>   (no app, loads < 3 sec)
        ↓
"How was your experience at <Shop Name>?"  ⭐⭐⭐⭐⭐
        ↓
 ┌──────────────┴───────────────┐
4–5 stars                     1–3 stars
 ↓                               ↓
"Post on Google" button        SAME "Post on Google" button
 ↓                               + "Tell the owner privately" form
Opens Google review box          (name, phone optional, message)
directly                         → owner gets push + email alert
                                         ↓
                                 Thank-you screen
```

Every customer sees the same Google button. The private form is an extra for unhappy customers, never a replacement.

**Google direct review link (free, no API needed):**

```
https://search.google.com/local/writereview?placeid=<PLACE_ID>
```

Get the Place ID from Google's free **Place ID Finder** tool (Google Maps Platform docs).

---

## 5. Pages / Screens

| # | Page | Route | Used by | Purpose |
|---|---|---|---|---|
| 1 | Rating page | `/r/[slug]` | Customer | Stars → Google button or feedback form |
| 2 | Thank-you screen | (same page, step 2) | Customer | Confirmation |
| 3 | Owner login | `/login` | Shop owner | Email + password |
| 4 | Owner dashboard | `/dashboard` | Shop owner | Stats, feedback list, QR download, alert settings |
| 5 | Admin login | `/login` (role = admin) | You | |
| 6 | Admin panel | `/admin` | You | Add/edit shops, Place ID, paid/unpaid, owner accounts |

---

## 6. Features

### MVP (version 1, build first)

- [ ] Rating page with shop logo, name and 5 stars
- [ ] 4–5 stars → "Post on Google" button
- [ ] 1–3 stars → private feedback form + small Google link
- [ ] Track every scan and rating
- [ ] Owner dashboard: total scans, average rating, ratings breakdown, feedback list
- [ ] Red badge for unread bad ratings
- [ ] QR poster download (PNG/PDF with shop name)
- [ ] Push notification alert on bad rating (PWA + Firebase)
- [ ] Email alert on bad rating (Resend)
- [ ] Admin panel: add shop, set Place ID, upload logo, create owner login, mark paid/unpaid
- [ ] Inactive shops (unpaid): rating page shows a "service paused" message
- [ ] Mobile-first design

### Later (version 2+)

- [ ] Razorpay subscription (UPI AutoPay ₹499/month)
- [ ] Charts: scans per day, ratings over time
- [ ] Hindi / Gujarati / other languages on the rating page
- [ ] Multiple branches per shop
- [ ] Staff tracking (separate QR per staff member)
- [ ] WhatsApp alerts (paid premium plan)
- [ ] Monthly report email to owner
- [ ] Referral program (shop refers shop → 1 month free)

---

## 7. Tech Stack (all free tiers)

| Layer | Tool | Free limit |
|---|---|---|
| Frontend + Backend | **Next.js** (App Router) | — |
| Database | **MongoDB Atlas M0 + Mongoose** | 512 MB |
| Auth | **Auth.js (NextAuth)**, credentials + bcrypt | — |
| Logo storage | **Cloudinary** | 25 credits/month |
| Push alerts | **Firebase Cloud Messaging** (web push, PWA) | Free |
| Email alerts | **Resend** | 3,000 emails/month |
| QR generation | `qrcode` npm package | Free |
| Hosting | **Vercel** | Hobby plan |
| Styling | **Tailwind CSS** | — |

**Monthly cost to start: ₹0.** (Domain ≈ ₹800–1,000/year.)

> ⚠️ **Vercel + MongoDB:** use a **cached global connection** (`lib/db.js`). Don't open a new connection per request, or the free cluster's connection limit runs out.

> ⚠️ **Vercel Hobby plan** is for non-commercial use. Move to Vercel Pro, Railway, Render or a ₹300–500/month VPS once shops start paying.

### Why not WhatsApp (for now)

The WhatsApp Business API charges per message and needs Meta approval. It's replaced with free **web push + email + dashboard badge**. Add WhatsApp later as a paid premium feature.

---

## 8. Database Models (MongoDB / Mongoose)

### `User`
```js
{
  _id,
  name: String,
  email: String,          // unique
  passwordHash: String,
  role: "admin" | "owner",
  shopId: ObjectId,       // for owners
  pushTokens: [String],   // Firebase FCM tokens
  createdAt, updatedAt
}
```

### `Shop`
```js
{
  _id,
  name: String,
  slug: String,           // unique, used in /r/<slug>
  logoUrl: String,        // Cloudinary
  googlePlaceId: String,
  ownerId: ObjectId,
  alertEmail: String,
  status: "trial" | "active" | "paused",
  trialEndsAt: Date,
  paidUntil: Date,
  plan: "basic" | "premium",
  createdAt, updatedAt
}
```

### `Rating`
```js
{
  _id,
  shopId: ObjectId,       // indexed
  stars: Number,          // 1–5
  clickedGoogle: Boolean,
  userAgent: String,
  createdAt               // indexed
}
```

### `Feedback`
```js
{
  _id,
  shopId: ObjectId,       // indexed
  ratingId: ObjectId,
  stars: Number,
  name: String,           // optional
  phone: String,          // optional
  message: String,
  isRead: Boolean,
  createdAt
}
```

### `Scan` (optional, can be merged into Rating)
```js
{ _id, shopId, source: "qr" | "nfc", createdAt }
```

**Storage check:** one rating ≈ 200–300 bytes, so 512 MB holds roughly 1.5–2 million ratings. Enough for years.

---

## 9. API Routes

| Method | Route | Who | Purpose |
|---|---|---|---|
| GET | `/api/shops/[slug]` | Public | Shop name, logo, Google link (only if active) |
| POST | `/api/scan` | Public | Log a scan |
| POST | `/api/rating` | Public | Save stars, return next step |
| POST | `/api/rating/[id]/google-click` | Public | Mark that the customer clicked Google |
| POST | `/api/feedback` | Public | Save feedback, trigger push + email |
| GET | `/api/dashboard/stats` | Owner | Scans, ratings, average |
| GET | `/api/dashboard/feedback` | Owner | Feedback list |
| PATCH | `/api/dashboard/feedback/[id]` | Owner | Mark as read |
| POST | `/api/push/register` | Owner | Save FCM token |
| GET | `/api/dashboard/qr` | Owner | Download QR poster |
| GET/POST | `/api/admin/shops` | Admin | List / create shops |
| PATCH | `/api/admin/shops/[id]` | Admin | Edit shop, status, paidUntil |
| POST | `/api/admin/owners` | Admin | Create owner login |
| POST | `/api/admin/upload` | Admin | Upload logo to Cloudinary |

**Security:**
- Rate-limit public routes (by IP) to stop spam ratings
- Check the owner's `shopId` on every dashboard route
- Admin routes require `role === "admin"`

---

## 10. Folder Structure

```
review-booster/
├── app/
│   ├── r/[slug]/page.jsx          # Rating page
│   ├── login/page.jsx
│   ├── dashboard/page.jsx         # Owner dashboard
│   ├── admin/page.jsx             # Admin panel
│   ├── api/                       # API routes (see section 9)
│   ├── layout.jsx
│   └── manifest.js                # PWA manifest
├── components/
│   ├── StarRating.jsx
│   ├── FeedbackForm.jsx
│   ├── StatsCards.jsx
│   ├── FeedbackList.jsx
│   ├── QrPoster.jsx
│   └── ShopForm.jsx
├── lib/
│   ├── db.js                      # Cached MongoDB connection
│   ├── auth.js                    # Auth.js config
│   ├── firebase-admin.js          # Send push
│   ├── email.js                   # Resend
│   ├── cloudinary.js
│   └── rateLimit.js
├── models/
│   ├── User.js
│   ├── Shop.js
│   ├── Rating.js
│   └── Feedback.js
├── public/
│   ├── firebase-messaging-sw.js   # Push service worker
│   └── icons/
├── .env.local                     # Secrets (never commit)
├── MASTER.md                      # This file
└── package.json
```

---

## 11. Environment Variables (`.env.local`)

```
MONGODB_URI=
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
ALERT_FROM_EMAIL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

NEXT_PUBLIC_SITE_URL=
```

Never commit `.env.local`. Add it to `.gitignore`.

---

## 12. Code Size Estimate

| Part | Lines (approx.) |
|---|---|
| Rating page | 250–350 |
| Owner dashboard | 500–700 |
| QR poster | 100–150 |
| Admin panel | 350–500 |
| Auth (Auth.js + bcrypt) | 250–400 |
| Database models + connection | 130–170 |
| Push notifications (PWA + FCM) | 200–300 |
| Email alerts | 60–100 |
| Logo upload (Cloudinary) | 50–80 |
| Shared UI / styling | 300–400 |
| Config | 50–80 |
| **MVP total** | **≈ 2,300–3,200** |
| Razorpay + charts + languages + branches (later) | +650–1,000 |
| **Full version** | **≈ 3,000–4,200** |

---

## 13. Build Plan

| Day | Work |
|---|---|
| 1 | Project setup, MongoDB connection, models, Tailwind |
| 2 | Rating page + rating/feedback APIs + Google link |
| 3 | Admin panel: add shop, Place ID, logo, owner account |
| 4 | Auth + owner dashboard (stats, feedback list, badge) |
| 5 | QR poster download + email alerts |
| 6 | PWA + Firebase push alerts |
| 7 | Rate limiting, testing on real phones, deploy to Vercel |

**After day 3** you can already demo the rating page to shops.

---

## 14. Sales Playbook

### Target shops
Restaurants, cafés, salons, clinics, dentists, mobile shops, sweet shops, gyms, coaching centres. **Best targets have fewer than 50 Google reviews.**

### Pitch (face-to-face)

1. Open Google Maps on your phone and show it: *"Your competitor has 450 reviews, you have 38."*
2. *"Customers like you, but finding your Google page takes too many steps. This QR opens the review box in one tap."*
3. *"And if someone is unhappy, you get an alert first, so you can call them and fix it."*
4. *"Try it free for 15 days. If your reviews don't go up, you pay nothing."*

### After 15 days
Show the dashboard: *"62 scans, 28 new Google reviews, 4 complaints caught privately."* Then ask for ₹499/month.

### Collecting payment
- First 10–20 shops: manual UPI (a QR or link from your UPI app)
- After that: Razorpay subscription with UPI AutoPay

### Growth
- Ask happy shops for referrals (1 month free per referral)
- Post before/after review counts on Instagram/LinkedIn
- Partner with local printing shops to sell standees

---

## 15. Costs

| Item | Cost |
|---|---|
| Hosting, DB, email, push (free tiers) | ₹0 |
| Domain | ~₹800–1,000/year |
| Paid hosting (once commercial) | ~₹300–1,700/month |
| QR standee printing | ₹100–150 each (charged to shop) |
| NFC cards | ₹80–120 each (charged to shop) |
| Razorpay fee | ~2% per transaction |

---

## 16. Risks & How to Handle Them

| Risk | Fix |
|---|---|
| Google policy violation (review gating) | Always show the Google link to everyone |
| Shops stop paying | Auto-pause the rating page after `paidUntil` |
| Spam ratings | IP rate limit + one rating per device per day |
| Free tier limits | Upgrade only after ~50 paying shops |
| Competitors (other review QR apps) | Compete on local, face-to-face service + low price + Indian languages |
| Owner never opens dashboard | Push + email alerts + monthly summary email |

---

## 17. Next Steps

- [ ] Choose final product name + buy domain
- [ ] Create MongoDB Atlas free cluster
- [ ] Create Firebase, Resend and Cloudinary accounts
- [ ] Build MVP (section 13)
- [ ] Get 5 shops on a free trial
- [ ] Convert to paid + collect testimonials
- [ ] Add Razorpay subscription
- [ ] Scale to 30 → 150 → 300 shops
