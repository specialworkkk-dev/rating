/** The owner's two sections, for the header tabs. */
export function ownerLinks(unread = 0) {
  return [
    { href: "/app/dashboard", label: "Dashboard", exact: true },
    { href: "/app/dashboard/ratings", label: "Daily ratings" },
    { href: "/app/dashboard/feedback", label: "Feedback", badge: unread },
  ];
}
