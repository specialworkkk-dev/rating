import UnavailableIcon from "@/components/UnavailableIcon";

/** What a customer sees when a shop's rating page is off. No reason, no contact details. */
export default function Unavailable({ shopName }) {
  return (
    <section className="mt-10 flex flex-col items-center rounded-3xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-stone-200">
      <UnavailableIcon />
      <h2 className="mt-5 text-xl font-semibold">Ratings are not available</h2>
      <p className="mt-2 text-muted">
        {shopName} isn’t collecting ratings at the moment.
        <br />
        Thank you for visiting!
      </p>
    </section>
  );
}
