"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { googleReviewUrl } from "@/lib/shop";
import { slugify } from "@/lib/shopInput";
import { btnPrimary, btnSecondary, card, smallInputClass as input } from "./ui";

const PLACE_ID_FINDER =
  "https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function ShopForm({ shop }) {
  const router = useRouter();
  const editing = Boolean(shop);
  const [f, setF] = useState({
    name: shop?.name || "",
    slug: shop?.slug || "",
    googlePlaceId: shop?.googlePlaceId || "",
    logoUrl: shop?.logoUrl || "",
    alertEmail: shop?.alertEmail || "",
    ...(shop ? {} : { monthlyPrice: "499" }),
  });
  const [slugTouched, setSlugTouched] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "error" | "ok", text }

  const set = (k) => (e) => {
    const v = e.target.value;
    setF((prev) => ({
      ...prev,
      [k]: v,
      ...(k === "name" && !slugTouched ? { slug: slugify(v) } : {}),
    }));
  };

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setUploading(false);
    e.target.value = "";
    if (!res?.ok) return setMsg({ type: "error", text: json?.error || "Upload failed" });
    setF((prev) => ({ ...prev, logoUrl: json.url }));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(editing ? `/api/admin/shops/${shop.id}` : "/api/admin/shops", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? f : { ...f, monthlyPrice: Number(f.monthlyPrice) }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setMsg({ type: "error", text: json?.error || "Couldn’t save" });
    if (editing) {
      setMsg({ type: "ok", text: "Saved" });
      router.refresh();
    } else {
      router.push(`/app/admin/shops/${json.shop.id}?created=1`);
    }
  }

  const testUrl = googleReviewUrl(f.googlePlaceId.trim());
  const slugChanged = editing && f.slug !== shop.slug;

  return (
    <form onSubmit={save} className={`${card} space-y-4`}>
      <h2 className="font-semibold">{editing ? "Shop details" : "New shop"}</h2>

      <Field label="Shop name">
        <input required value={f.name} onChange={set("name")} maxLength={80} className={input} />
      </Field>

      <Field
        label="Link name"
        hint={
          slugChanged
            ? "⚠ Changing this breaks QR codes that are already printed."
            : `Rating page: /r/${f.slug || "…"}`
        }
      >
        <input
          required
          value={f.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug")(e);
          }}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          minLength={3}
          maxLength={60}
          className={input}
        />
      </Field>

      <Field
        label="Google Place ID"
        hint={
          <>
            Find it with Google’s{" "}
            <a href={PLACE_ID_FINDER} target="_blank" rel="noopener noreferrer" className="underline">
              Place ID Finder
            </a>
            .
            {testUrl && (
              <>
                {" "}
                <a href={testUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Test the review link ↗
                </a>
              </>
            )}
          </>
        }
      >
        <input
          value={f.googlePlaceId}
          onChange={set("googlePlaceId")}
          placeholder="ChIJ…"
          className={`${input} font-mono`}
        />
      </Field>

      <Field label="Logo" hint="Upload (PNG/JPG/WebP/SVG, under 2 MB) or paste an https:// image link.">
        <div className="flex items-center gap-3">
          {f.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.logoUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-stone-200" />
          ) : (
            <div className="size-12 shrink-0 rounded-lg bg-stone-100" />
          )}
          <input value={f.logoUrl} onChange={set("logoUrl")} placeholder="https://…" className={input} />
          <label className={`${btnSecondary} shrink-0 cursor-pointer`}>
            {uploading ? "Uploading…" : "Upload"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload} className="hidden" />
          </label>
        </div>
      </Field>

      {!editing && (
        <Field label="Monthly price" hint="What this shop will pay after the free trial. You can change it any time.">
          <span className="flex w-48 items-center rounded-lg border border-stone-300 bg-white focus-within:border-brand-500">
            <span className="pl-3 text-sm text-muted">₹</span>
            <input
              type="number"
              min={0}
              max={1000000}
              step={1}
              inputMode="numeric"
              required
              value={f.monthlyPrice}
              onChange={set("monthlyPrice")}
              className="w-full bg-transparent px-2 py-2 text-sm tabular-nums outline-none"
            />
            <span className="pr-3 text-sm text-muted">/mo</span>
          </span>
        </Field>
      )}

      <Field label="Alert email" hint="Where bad-rating alerts go. Defaults to the owner’s login email.">
        <input type="email" value={f.alertEmail} onChange={set("alertEmail")} className={input} />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy || uploading} className={btnPrimary}>
          {busy ? "Saving…" : editing ? "Save changes" : "Create shop (15-day trial)"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-emerald-700"}`} role="status">
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}
