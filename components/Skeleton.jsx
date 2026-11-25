/** Grey placeholder blocks shown instantly while a page loads. */
export function Bone({ className = "" }) {
  return <span className={`block animate-pulse rounded-lg bg-stone-200/80 motion-reduce:animate-none ${className}`} />;
}

export function CardBones({ className = "", children }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 ${className}`}>{children}</div>;
}

export function LoadingLabel() {
  return <span className="sr-only" role="status">Loading…</span>;
}
