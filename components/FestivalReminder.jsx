"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Owner dashboard: "🪔 Diwali is in 5 days. Send your customers an offer?" (hide per festival). */
export default function FestivalReminder({ festival, offersOn }) {
  const key = `rb_fest_${festival.date}`;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(Boolean(localStorage.getItem(key)));
    } catch {
      setHidden(false);
    }
  }, [key]);

  if (hidden) return null;
  const when = festival.days === 0 ? "is today" : festival.days === 1 ? "is tomorrow" : `is in ${festival.days} days`;
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
      <span className="text-3xl" aria-hidden="true">
        {festival.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {festival.name} {when}!
        </p>
        <p className="text-sm text-stone-600">
          {offersOn ? "Send your followers a festive offer to bring them in." : "Shops with Offers send festive offers straight to customers’ phones."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={offersOn ? `/app/dashboard/offers?template=${festival.template}` : "/app/dashboard/offers"}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          {offersOn ? "Create offer" : "See Offers ⭐"}
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(key, "1");
            } catch {}
            setHidden(true);
          }}
          className="rounded-xl px-3 py-2 text-sm text-stone-500 hover:bg-white/60"
        >
          Not now
        </button>
      </div>
    </section>
  );
}
