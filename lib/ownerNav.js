/** The owner's two sections, for the header tabs. */
export function ownerLinks(unread = 0) {
  return [
    { href: "/dashboard", label: "Dashboard", exact: true },
    { href: "/dashboard/ratings", label: "Daily ratings" },
    { href: "/dashboard/feedback", label: "Feedback", badge: unread },
  ];
}
