// Festivals and occasions shops run offers for. Owners get a reminder on their
// dashboard a few days before. Dates checked against timeanddate.com and
// drikpanchang.com (both agree unless marked). Add next year's dates each
// December. Eid dates depend on the moon and may move by a day.
export const FESTIVALS = [
  { date: "2026-12-25", name: "Christmas", emoji: "🎄", template: "christmas" },
  { date: "2027-01-01", name: "New Year", emoji: "🎆", template: "newyear" },
  { date: "2027-01-14", name: "Lohri & Makar Sankranti", emoji: "🪁", template: "sankranti" },
  { date: "2027-01-15", name: "Pongal", emoji: "🌾", template: "sankranti" },
  { date: "2027-01-26", name: "Republic Day", emoji: "🇮🇳", template: "national" },
  { date: "2027-02-14", name: "Valentine’s Day", emoji: "❤️", template: "valentine" },
  { date: "2027-03-06", name: "Maha Shivaratri", emoji: "🕉️", template: "festival" },
  { date: "2027-03-10", name: "Eid al-Fitr (expected)", emoji: "🌙", template: "eid" },
  { date: "2027-03-22", name: "Holi", emoji: "🎨", template: "holi" },
  { date: "2027-04-07", name: "Ugadi & Gudi Padwa", emoji: "🌸", template: "festival" },
  { date: "2027-04-15", name: "Ram Navami", emoji: "🪔", template: "festival" },
  { date: "2027-05-17", name: "Eid al-Adha (expected)", emoji: "🌙", template: "eid" },
  { date: "2027-08-15", name: "Independence Day", emoji: "🇮🇳", template: "national" },
  { date: "2027-08-17", name: "Raksha Bandhan", emoji: "🎀", template: "rakhi" },
  { date: "2027-08-25", name: "Janmashtami", emoji: "🪈", template: "festival" },
  { date: "2027-09-04", name: "Ganesh Chaturthi", emoji: "🐘", template: "festival" },
  { date: "2027-09-12", name: "Onam", emoji: "🌼", template: "festival" },
  { date: "2027-09-30", name: "Navratri", emoji: "🪔", template: "navratri" },
  { date: "2027-10-09", name: "Dussehra", emoji: "🏹", template: "festival" },
  { date: "2027-10-18", name: "Karwa Chauth", emoji: "🌙", template: "festival" },
  { date: "2027-10-29", name: "Diwali", emoji: "🪔", template: "diwali" },
  { date: "2027-10-31", name: "Bhai Dooj", emoji: "🎁", template: "festival" },
  { date: "2027-11-04", name: "Chhath Puja", emoji: "🌅", template: "festival" },
  { date: "2027-12-25", name: "Christmas", emoji: "🎄", template: "christmas" },
];

/** Remind this many days before (and on the day). */
export const REMIND_DAYS = 7;

/** The next festival within REMIND_DAYS of `todayKey` ("YYYY-MM-DD"), with days left, or null. */
export function upcomingFestival(todayKey) {
  const today = Date.parse(`${todayKey}T00:00:00Z`);
  for (const f of FESTIVALS) {
    const days = Math.round((Date.parse(`${f.date}T00:00:00Z`) - today) / 864e5);
    if (days >= 0 && days <= REMIND_DAYS) return { ...f, days };
  }
  return null;
}
