// Ready-made offers owners can tap and edit. Kept generic (no business
// claims), and never about ratings or reviews.
export const OFFER_TEMPLATES = [
  { id: "weekend", label: "🎉 Weekend special", text: "🎉 Weekend special! 15% off on everything this Saturday & Sunday. See you soon! 😊" },
  { id: "happyhours", label: "☕ Happy hours", text: "☕ Happy hours today 4–6 pm: buy 1, get 1 free! ⏰ Don’t miss it." },
  { id: "newarrival", label: "🆕 New arrival", text: "🆕 New arrivals just landed! Come and see them first ✨" },
  { id: "flash", label: "💥 Flash sale", text: "💥 Flash sale! 20% off today only. Hurry, ends tonight ⏰" },
  { id: "bogo", label: "🛍️ Buy 1 Get 1", text: "🛍️ Buy 1, get 1 free on selected items this week! 🔥" },
  { id: "diwali", label: "🪔 Diwali", text: "🪔 Happy Diwali! Festive offer: 20% off on all orders this week. 🎁✨" },
  { id: "navratri", label: "🪔 Navratri", text: "🪔 Navratri special! Special festive prices all 9 days. 🌸" },
  { id: "holi", label: "🎨 Holi", text: "🎨 Happy Holi! Colourful deals: 15% off till Holi. 🌈" },
  { id: "rakhi", label: "🎀 Raksha Bandhan", text: "🎀 Raksha Bandhan special! Gift packs with 10% off this week. 🎁" },
  { id: "eid", label: "🌙 Eid", text: "🌙 Eid Mubarak! Special festive offers all week. ✨" },
  { id: "christmas", label: "🎄 Christmas", text: "🎄 Merry Christmas! Festive treats with 15% off till 25 Dec. 🎅" },
  { id: "newyear", label: "🎆 New Year", text: "🎆 Happy New Year! Start the year with 20% off. 🥳" },
  { id: "sankranti", label: "🪁 Sankranti / Pongal", text: "🪁 Happy Sankranti! Festive special prices this week. 🌾" },
  { id: "national", label: "🇮🇳 National holiday", text: "🇮🇳 Celebrate with us! Special holiday offer: 10% off today. 🎉" },
  { id: "valentine", label: "❤️ Valentine’s", text: "❤️ Valentine’s special! Treats for two at a special price. 💝" },
  { id: "festival", label: "✨ Festival", text: "✨ Festival special! Celebrate with our festive offers this week. 🎉" },
  { id: "monsoon", label: "🌧️ Monsoon", text: "🌧️ Monsoon special! Hot favourites at 10% off on rainy days. ☕" },
];

export const templateById = (id) => OFFER_TEMPLATES.find((t) => t.id === id) || null;

const SKIP = ["THE", "AND", "FOR", "OFF", "ALL", "GET", "NEW", "YOU", "OUR", "THIS", "WITH", "FROM", "HAPPY", "SPECIAL"];

/** The word part of a counter code, from the offer text: "🪔 Happy Diwali! …" → "DIWALI". */
export function offerCodeWord(text) {
  const words = String(text || "").toUpperCase().match(/[A-Z]{3,}/g) || [];
  return (words.find((w) => !SKIP.includes(w)) || "OFFER").slice(0, 8);
}

/** A counter code like "DIWALI-4821". */
export const makeOfferCode = (text, digits = String(Math.floor(1000 + Math.random() * 9000))) => `${offerCodeWord(text)}-${digits}`;
