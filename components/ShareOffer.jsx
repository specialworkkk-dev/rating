"use client";

import { useState } from "react";

/** "Share with friends": the phone's share sheet, or WhatsApp where that isn't available. */
export default function ShareOffer({ shopName, text, url }) {
  const [done, setDone] = useState(false);
  const message = `${text}\n— ${shopName}`;

  async function share() {
    const link = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: shopName, text: message, url: link });
        setDone(true);
        return;
      } catch (err) {
        if (err?.name === "AbortError") return; // closed the share sheet
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${message}\n${link}`)}`, "_blank", "noopener");
    setDone(true);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#1f8f4e] px-6 py-3 font-semibold text-[#1f8f4e]"
    >
      📤 {done ? "Shared! Share again" : "Share with friends"}
    </button>
  );
}
