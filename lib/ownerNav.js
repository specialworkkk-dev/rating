/** The owner's sections, for the header tabs. */
export function ownerLinks(unread = 0) {
  return [
    // `short`: the name in the phone tab bar, where four tabs share the width.
    { href: "/app/dashboard", label: "Dashboard", short: "Home", exact: true },
    { href: "/app/dashboard/ratings", label: "Daily ratings", short: "Daily" },
    { href: "/app/dashboard/feedback", label: "Feedback", badge: unread },
    { href: "/app/dashboard/offers", label: "Offers" },
  ];
}
