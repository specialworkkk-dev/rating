import RawKeepSelect from "@/components/RawKeepSelect";
import ServicePlanEditor from "@/components/ServicePlanEditor";
import UsageMeter, { LevelLabel } from "@/components/UsageMeter";
import { btnPrimary, btnSecondary, card, fmtDate } from "@/components/ui";
import { fmtFull, fmtNum } from "@/lib/format";
import { formatINR } from "@/lib/pricing";
import { BACKUP_EVERY_DAYS, getMongoUsage, getVercelUsage } from "@/lib/services";
import { fmtBytes, SERVICES } from "@/lib/servicePlans";
import { requirePageRole } from "@/lib/session";

export const metadata = { title: "Services · Admin · Review Booster" };

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
const fmtMonth = (key) => monthFmt.format(new Date(`${key}-01T00:00:00Z`));
const pct = (p) => (p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`);
const approx = (n) => fmtNum(n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n));

export default async function ServicesPage() {
  await requirePageRole("admin");
  const [vercel, mongo] = await Promise.all([getVercelUsage(), getMongoUsage()]);
  const totalCost = vercel.cost + mongo.cost;
  const allFree = vercel.free && mongo.free;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <h1 className="text-xl font-bold">Services</h1>
          <p className="text-sm text-muted">The outside services the app runs on, how much of each plan is used, and when to upgrade.</p>
        </div>
        <p className="ml-auto text-sm">
          Hosting cost <span className="text-lg font-bold">{formatINR(totalCost)}</span>
          <span className="text-muted"> / month{allFree ? " · all on free plans" : ""}</span>
        </p>
      </div>

      <VercelCard v={vercel} />
      <MongoCard m={mongo} />
    </div>
  );
}

function CardHeader({ id, setting, icon }) {
  const s = SERVICES[id];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-stone-100">{icon}</span>
      <div className="min-w-0">
        <h2 className="font-semibold">{s.name}</h2>
        <p className="text-sm text-muted">{s.role}</p>
      </div>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${setting.free ? "bg-emerald-100 text-emerald-800" : "bg-violet-100 text-violet-800"}`}>
          {setting.planLabel} · {setting.free ? "Free" : "Paid"}
        </span>
        <span className="font-semibold tabular-nums">{formatINR(setting.cost)}/mo</span>
      </div>
    </div>
  );
}

function Fact({ label, value, hint }) {
  return (
    <div className="min-w-0 rounded-xl bg-stone-50 p-2.5 sm:p-3">
      <dt className="text-[11px] leading-tight text-muted sm:text-xs">{label}</dt>
      <dd className="mt-1 text-base font-bold sm:text-lg">{value}</dd>
      {hint && <dd className="text-[11px] leading-tight text-muted sm:text-xs">{hint}</dd>}
    </div>
  );
}

function Footer({ id, setting, children }) {
  const s = SERVICES[id];
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
      <p className="min-w-0 flex-1 basis-64 text-xs text-muted">
        {children}{" "}
        <a href={s.dashboard} target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">
          Open {s.name} ↗
        </a>
      </p>
      <ServicePlanEditor serviceId={id} setting={setting} />
    </div>
  );
}

function VercelCard({ v }) {
  const endLabel = fmtDate(`${v.monthEnd}T12:00:00+05:30`);
  return (
    <section className={`${card} space-y-5`}>
      <CardHeader
        id="vercel"
        setting={v}
        icon={
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M12 3 22 20H2z" fill="#111" />
          </svg>
        }
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-bold">≈ {approx(v.used)}</span>
          <span className="text-sm text-muted">function calls this month, of {fmtNum(v.limit)}{v.free ? "" : " included"}</span>
          <span className="ml-auto text-sm font-semibold tabular-nums">{pct(v.percent)}</span>
        </div>
        <UsageMeter
          percent={v.percent}
          level={v.level}
          marker={v.projectedPercent}
          markerLabel={`At this pace: ≈ ${approx(v.projected)} by ${endLabel}`}
          label="Vercel function calls used this month"
        />
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <LevelLabel level={v.level} />
          <span className="text-muted">
            · By {endLabel} at this pace: ≈ {approx(v.projected)} ({pct(v.projectedPercent)}
            {v.projectedPercent > v.percent ? ", the dark mark" : ""})
          </span>
        </p>
      </div>

      {v.commercialWarning > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          ⚠ Vercel’s free Hobby plan is for non-commercial use, and {v.commercialWarning} shop{v.commercialWarning > 1 ? "s are" : " is"} paying you. Move to
          the Pro plan (about $20/month), then choose “Pro” below.
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Fact label="Customers per day now" value={approx(v.visitsPerDay)} hint="average of the last 30 days" />
        <Fact label="Room on this plan for" value={`≈ ${approx(v.capacityPerDay)}`} hint="customers a day, all shops together" />
        <Fact label="Calls per customer visit" value={`≈ ${v.callsPerVisit.toFixed(1)}`} hint="open, rate, Google or feedback" />
      </dl>

      <div>
        <h3 className="text-sm font-semibold">Last 6 months</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Month</th>
                <th className="py-2 pr-3 text-right font-medium">Customer visits</th>
                <th className="py-2 pr-3 text-right font-medium">≈ Function calls</th>
                <th className="py-2 text-right font-medium">Of limit</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {v.months.toReversed().map((m, i) => (
                <tr key={m.month} className="border-b border-stone-100 last:border-0">
                  <td className="py-2 pr-3">
                    {fmtMonth(m.month)}
                    {i === 0 && <span className="block text-xs text-muted sm:inline"> (so far)</span>}
                  </td>
                  <td className="py-2 pr-3 text-right">{fmtNum(m.visits)}</td>
                  <td className="py-2 pr-3 text-right">{approx(m.calls)}</td>
                  <td className="py-2 text-right">{pct(v.limit ? (m.calls / v.limit) * 100 : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer id="vercel" setting={v}>
        Estimated from the visits the app counts (plus a margin for owner dashboards, reloads and logins). Exact numbers are in{" "}
        {SERVICES.vercel.usageHelp}.
      </Footer>
    </section>
  );
}

function Backups({ last }) {
  const days = last ? Math.floor((Date.now() - new Date(last.at)) / 864e5) : null;
  const overdue = days == null || days >= BACKUP_EVERY_DAYS;
  return (
    <div className={`rounded-xl p-4 text-sm ring-1 ${overdue ? "bg-amber-50 ring-amber-200" : "bg-emerald-50 ring-emerald-200"}`}>
      <h3 className="font-semibold">Backups</h3>
      <p className="mt-1 text-stone-700">
        {last ? (
          <>
            Last backup: <b>{fmtFull(last.at)}</b> ({last.type === "full" ? "full" : "essential"})
            {overdue ? ". It’s time for a new one." : "."}
          </>
        ) : (
          "No backup downloaded yet."
        )}{" "}
        The free database plan may not keep backups for you, so download one every week and keep it somewhere safe (e.g. Google
        Drive). The file holds customers’ phone numbers, so don’t share it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="/api/admin/backup?type=essential" className={btnPrimary} download>
          ⬇ Download backup
        </a>
        <a href="/api/admin/backup?type=full" className={btnSecondary} download>
          ⬇ Full backup (with raw ratings)
        </a>
      </div>
      <p className="mt-2 text-xs text-muted">
        “Backup” has every shop, login, feedback message and all figures. “Full” also has each individual rating and scan from the
        last {"~"}3 months, so it’s bigger. To restore, see scripts/restore.mjs in the code.
      </p>
    </div>
  );
}

function MongoCard({ m }) {
  const limitBytes = m.limit * 1048576;
  const othersBytes = m.others.reduce((a, d) => a + d.bytes, 0);
  const free = Math.max(0, limitBytes - m.used);
  return (
    <section className={`${card} space-y-5`}>
      <CardHeader
        id="mongodb"
        setting={m}
        icon={
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M12 2c3.5 4 5.5 7.6 5.5 11.2 0 3.6-2.4 6.2-5 7.3L12 22l-.5-1.5c-2.6-1.1-5-3.7-5-7.3C6.5 9.6 8.5 6 12 2z" fill="#00a35c" />
            <path d="M12 6v16" stroke="#fff" strokeWidth="1.2" />
          </svg>
        }
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-bold">{fmtBytes(m.used)}</span>
          <span className="text-sm text-muted">used of {fmtBytes(limitBytes)}</span>
          <span className="ml-auto text-sm font-semibold tabular-nums">{pct(m.percent)}</span>
        </div>
        <UsageMeter percent={m.percent} level={m.level} label="Database storage used" />
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <LevelLabel level={m.level} />
          <span className="text-muted">· the limit is for the whole cluster, all projects on it together</span>
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Fact label="This app" value={fmtBytes(m.app)} hint={`database “${m.appName}”`} />
        <Fact label="Other projects" value={othersBytes ? fmtBytes(othersBytes) : "None"} hint={`${m.others.length} other database${m.others.length === 1 ? "" : "s"} on this cluster`} />
        <Fact label="Free" value={fmtBytes(free)} />
      </dl>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">This app’s data</h3>
          <ul className="mt-2 divide-y divide-stone-100 text-sm">
            {m.groups
              .filter((g) => g.bytes > 0)
              .map((g) => (
                <li key={g.id} className="flex items-baseline gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    {g.label}
                    {g.hint && <span className="block text-xs text-muted">{g.hint}</span>}
                  </span>
                  <span className="tabular-nums">{fmtBytes(g.bytes)}</span>
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Other projects on this cluster</h3>
          {m.others.length === 0 ? (
            <p className="mt-2 text-sm text-muted">None, this app has the cluster to itself.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100 text-sm">
              {m.others.map((d) => (
                <li key={d.name} className="flex items-baseline gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate">
                    {d.name}
                    {d.name.startsWith("sample_") && <span className="block text-xs text-muted">MongoDB’s sample data</span>}
                  </span>
                  <span className="tabular-nums">{fmtBytes(d.bytes)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {m.sampleData.length > 0 && (
        <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-950 ring-1 ring-sky-200">
          💡 {m.sampleData.map((d) => d.name).join(", ")} {m.sampleData.length > 1 ? "are" : "is"} MongoDB’s practice data, not used by any app.
          Deleting {m.sampleData.length > 1 ? "them" : "it"} in Atlas (Browse Collections → delete database) frees{" "}
          {fmtBytes(m.sampleData.reduce((a, d) => a + d.bytes, 0))}.
        </p>
      )}

      <div className="rounded-xl bg-stone-50 p-4 text-sm">
        <h3 className="font-semibold">Where this is heading</h3>
        <p className="mt-1 text-muted">
          About <b className="text-ink">{approx(m.visitsPerDay)}</b> customers a day right now. Ratings and visits older than{" "}
          {m.keepMonths} months are cleaned up, so this app levels off at about <b className="text-ink">{fmtBytes(m.steadyApp)}</b>{" "}
          ({pct(m.steadyPercent)} of the plan with the other projects). This plan has room for about{" "}
          <b className="text-ink">{approx(m.capacityPerDay)}</b> customers a day.
        </p>
        <RawKeepSelect
          months={m.rawKeep.months}
          changed={m.rawKeep.at ? `${fmtFull(m.rawKeep.at)}${m.rawKeep.by ? ` by ${m.rawKeep.by}` : ""}` : null}
        />
        <p className="mt-2 text-muted">
          Daily cleanup (about 3 AM):{" "}
          {m.lastCleanup ? (
            <>
              last run <span className="text-ink">{fmtFull(m.lastCleanup.at)}</span>, removed{" "}
              {fmtNum((m.lastCleanup.deleted?.ratings || 0) + (m.lastCleanup.deleted?.scans || 0) + (m.lastCleanup.deleted?.direct || 0))} old records.
            </>
          ) : (
            "hasn’t run yet. It starts after the next deploy with CRON_SECRET set."
          )}
        </p>
      </div>

      <Backups last={m.lastBackup} />

      <Footer id="mongodb" setting={m}>
        Exact sizes, read from the database just now. Atlas’s own page can show slightly different numbers.
      </Footer>
    </section>
  );
}
