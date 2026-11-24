export default function ShopHeader({ name, logoUrl }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex flex-col items-center text-center">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={88}
          height={88}
          className="size-22 rounded-2xl object-cover shadow-sm ring-1 ring-stone-200"
        />
      ) : (
        <div className="flex size-22 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
          {initials}
        </div>
      )}
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{name}</h1>
    </header>
  );
}
