/** Small logo mark: a rounded square with a star. */
export default function BrandMark({ className = "size-9" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#f59e0b" />
      <path
        fill="#fff"
        d="M20 9.5l3.2 6.5 7.2 1-5.2 5.1 1.2 7.1L20 25.8l-6.4 3.4 1.2-7.1L9.6 17l7.2-1L20 9.5z"
      />
    </svg>
  );
}
