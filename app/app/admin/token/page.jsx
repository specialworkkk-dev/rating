import BurnNowButton from "@/components/BurnNowButton";
import TokenSwitches from "@/components/TokenSwitches";
import TokenWallet from "@/components/TokenWallet";
import { getTokenSettings } from "@/lib/tokenSettings";
import { card } from "@/components/ui";
import { fmtNum } from "@/lib/format";
import { requirePageRole } from "@/lib/session";
import { explorerAddress, explorerTx, getTokenStatus, INITIAL_SUPPLY } from "@/lib/token";

export const metadata = { title: "Token · Admin" };
export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtDay = (key) => dayFmt.format(new Date(`${key}T00:00:00Z`));
const fmtUnix = (s) => dayFmt.format(new Date(s * 1000));
const tok = (n) => (n == null ? "—" : fmtNum(Math.round(n)));
const pctOf = (n) => (n == null ? "" : `${((n / INITIAL_SUPPLY) * 100).toFixed(n && n / INITIAL_SUPPLY < 0.001 ? 4 : 2)}%`);

const STATUS = {
  confirmed: ["✓ Burned", "bg-emerald-100 text-emerald-800"],
  skipped: ["No ratings", "bg-stone-100 text-stone-600"],
  pending: ["Waiting", "bg-amber-100 text-amber-900"],
  sent: ["Check BscScan", "bg-amber-100 text-amber-900"],
  failed: ["Failed, will retry", "bg-red-100 text-red-800"],
};

function Short({ c, a }) {
  if (!a) return <span className="text-muted">not set</span>;
  const link = explorerAddress(c, a);
  const text = `${a.slice(0, 6)}…${a.slice(-4)}`;
  return link ? (
    <a href={link} target="_blank" rel="noreferrer" className="font-mono text-brand-700 underline">
      {text}
    </a>
  ) : (
    <span className="font-mono">{text}</span>
  );
}

function Figure({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-stone-50 p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-muted">{hint}</dd>}
    </div>
  );
}

export default async function TokenPage() {
  await requirePageRole("admin");
  const [{ config: c, chain, burns, error }, settings] = await Promise.all([getTokenStatus(), getTokenSettings()]);
  const confirmed = burns.filter((b) => b.status === "confirmed");
  const recentDaily = confirmed.slice(0, 7).reduce((a, b) => a + (b.tokens || 0), 0) / Math.max(1, Math.min(7, confirmed.length));
  const poolDaysLeft = chain?.burnPool && recentDaily ? Math.round(chain.burnPool / recentDaily) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-bold">Review Booster Token (RBT)</h1>
          <p className="text-sm text-muted">
            {c.perRating} RBT burned for every real rating, once a day, from the 20% burn pool.
          </p>
        </div>
        {c.network && (
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${c.network.real ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800"}`}>
            {c.network.real ? "⚠ " : ""}
            {c.network.label}
          </span>
        )}
      </div>

      <TokenSwitches
        settings={settings}
        vesting={chain?.vesting ? { cliff: fmtUnix(chain.vesting.cliff), end: fmtUnix(chain.vesting.end) } : null}
      />

      {!c.configured ? (
        <section className={`${card} space-y-2 text-sm`}>
          <h2 className="font-semibold">Not set up yet</h2>
          <p className="text-muted">
            The token isn’t connected to this app. Follow <b>token/LAUNCH.md</b> in the code: deploy on the BNB test network first,
            then add the settings it prints to the app’s environment variables.
          </p>
        </section>
      ) : null}

      {c.problems.length > 0 && c.configured && (
        <section className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
          <p className="font-semibold">Burning is paused until these are done:</p>
          <ul className="mt-1 list-disc pl-5">
            {c.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">Couldn’t read the blockchain right now: {error}</p>
      )}

      {chain && (
        <>
          <section className={`${card} space-y-4`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <h2 className="font-semibold">Supply</h2>
              <span className="text-muted">· token</span>
              <Short c={c} a={c.token} />
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Figure label="Total supply now" value={tok(chain.supply)} hint={`of ${fmtNum(INITIAL_SUPPLY)} created`} />
              <Figure label="Burned so far" value={tok(chain.burned)} hint={pctOf(chain.burned)} />
              <Figure
                label="Burn wallet (on the server)"
                value={tok(chain.burnPool)}
                hint={
                  poolDaysLeft != null ? (
                    <span className={poolDaysLeft < 14 ? "font-semibold text-red-700" : ""}>
                      ≈ {fmtNum(poolDaysLeft)} days of burns{poolDaysLeft < 14 ? ": top up from the reserve" : ""}
                    </span>
                  ) : (
                    "ready for daily burns"
                  )
                }
              />
              <Figure label="Burn reserve (cold)" value={c.reserve ? tok(chain.reserve) : "—"} hint={c.reserve ? <Short c={c} a={c.reserve} /> : "set TOKEN_BURN_RESERVE_WALLET"} />
              <Figure label="Liquidity wallet" value={tok(chain.liquidity)} hint={<Short c={c} a={c.liquidity} />} />
              <Figure label="PancakeSwap pool" value={c.pair ? tok(chain.pair) : "—"} hint={c.pair ? <Short c={c} a={c.pair} /> : "added at launch"} />
              <Figure
                label="Burn wallet gas"
                value={chain.burnGasBnb == null ? "—" : `${chain.burnGasBnb.toFixed(4)} BNB`}
                hint={chain.lowGas ? <span className="font-semibold text-red-700">⚠ Low: add BNB so burns can run</span> : <Short c={c} a={chain.burnWallet} />}
              />
            </dl>
          </section>

          {chain.vesting && (
            <section className={`${card} space-y-3`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <h2 className="font-semibold">Team 50% (time-locked)</h2>
                <Short c={c} a={c.vesting} />
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Figure label="Still locked" value={tok(chain.vesting.locked)} />
                <Figure label="Released so far" value={tok(chain.vesting.released)} />
                <Figure label="Can be released now" value={tok(chain.vesting.releasable)} />
              </dl>
              <p className="text-sm text-muted">
                Nothing unlocks before <b className="text-ink">{fmtUnix(chain.vesting.cliff)}</b>; then it unlocks steadily until{" "}
                <b className="text-ink">{fmtUnix(chain.vesting.end)}</b>, only to <Short c={c} a={chain.vesting.beneficiary} />. Anyone can
                check this schedule on BscScan.
              </p>
            </section>
          )}
        </>
      )}

      {c.configured && (
        <section className={`${card} space-y-3`}>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="font-semibold">Daily burns</h2>
              <p className="text-xs text-muted">
                Runs every night at about 3 AM for the day before{c.startDay ? `, starting ${fmtDay(c.startDay)}` : ""}. A day is never burned twice.
              </p>
            </div>
            <span className="ml-auto">
              <BurnNowButton disabled={!c.canBurn} />
            </span>
          </div>
          {burns.length === 0 ? (
            <p className="text-sm text-muted">No burns yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs text-muted">
                    <th className="py-2 pr-3 font-medium">Day</th>
                    <th className="py-2 pr-3 text-right font-medium">Ratings</th>
                    <th className="py-2 pr-3 text-right font-medium">RBT burned</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Transaction</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {burns.map((b) => {
                    const [label, cls] = STATUS[b.status] || [b.status, "bg-stone-100"];
                    const link = explorerTx(c, b.txHash);
                    return (
                      <tr key={b._id} className="border-b border-stone-100 last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDay(b._id)}</td>
                        <td className="py-2 pr-3 text-right">{fmtNum(b.ratings)}</td>
                        <td className="py-2 pr-3 text-right">{fmtNum(b.status === "confirmed" ? b.tokens : 0)}</td>
                        <td className="py-2 pr-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`} title={b.error || b.note || ""}>
                            {label}
                          </span>
                        </td>
                        <td className="py-2">
                          {link ? (
                            <a href={link} target="_blank" rel="noreferrer" className="font-mono text-xs text-brand-700 underline">
                              {b.txHash.slice(0, 10)}…
                            </a>
                          ) : b.txHash ? (
                            <span className="font-mono text-xs">{b.txHash.slice(0, 10)}…</span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {c.configured && <TokenWallet token={c.token} chainId={c.network.chainId} symbol={chain?.symbol || "RBT"} />}
    </div>
  );
}
