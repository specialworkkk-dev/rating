import UnavailableIcon from "@/components/UnavailableIcon";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <UnavailableIcon />
      <h1 className="mt-5 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">This link or QR code doesn’t lead to an active page.</p>
    </main>
  );
}
