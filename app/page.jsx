export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Review Booster</h1>
      <p className="mt-3 text-muted">
        A QR standee for your counter. Happy customers reach your Google review box in one tap;
        unhappy ones can tell you privately first.
      </p>
      <a
        href="/login"
        className="mt-8 inline-flex w-fit rounded-xl bg-ink px-5 py-3 font-semibold text-white"
      >
        Shop owner login
      </a>
    </main>
  );
}
