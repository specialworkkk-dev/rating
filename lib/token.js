// Review Booster Token (RBT): the daily burn and the admin's token figures.
//
// Each Indian calendar day, after it ends, the server burns
//   (real ratings that day) x TOKEN_BURN_PER_RATING
// tokens from the burn-pool wallet. Only the burn wallet's key is on the
// server; the team's 50% sits in a public time-lock contract.
//
// A day can never be burned twice: each day reserves one transaction number
// ("nonce") of the burn wallet before sending, and a retry reuses it, so at
// most one burn transaction can ever exist for that day.
import { Contract, JsonRpcProvider, Wallet, formatEther, getAddress, isAddress, parseEther } from "ethers";
import { connectDB } from "@/lib/db";
import { addDaysKey, dayKeysBetween } from "@/lib/stats";
import { ensureAllDailyCounts, istDayKey } from "@/lib/totals";
import ShopDay from "@/models/ShopDay";
import TokenBurn from "@/models/TokenBurn";

export const NETWORKS = {
  local: { label: "Local test chain", chainId: 31337, rpc: "http://127.0.0.1:8545", explorer: null, real: false },
  "bsc-testnet": { label: "BNB test network", chainId: 97, rpc: "https://data-seed-prebsc-1-s1.bnbchain.org:8545", explorer: "https://testnet.bscscan.com", real: false },
  bsc: { label: "BNB Smart Chain (real money)", chainId: 56, rpc: "https://bsc-dataseed.bnbchain.org", explorer: "https://bscscan.com", real: true },
};

export const INITIAL_SUPPLY = 1_000_000_000; // whole tokens
const MAX_CATCH_UP_DAYS = 7; // days burned per run, oldest first
const LOW_GAS_BNB = 0.005;

const TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function burn(uint256 value)",
  "function symbol() view returns (string)",
];
const VESTING_ABI = [
  "function releasable(address token) view returns (uint256)",
  "function released(address token) view returns (uint256)",
  "function start() view returns (uint256)",
  "function duration() view returns (uint256)",
  "function cliff() view returns (uint256)",
  "function owner() view returns (address)",
];

const addr = (v) => (v && isAddress(v) ? getAddress(v) : null);

/** Settings from the environment, plus a list of what still blocks burning. */
export function tokenConfig() {
  const e = process.env;
  const networkKey = NETWORKS[e.TOKEN_NETWORK] ? e.TOKEN_NETWORK : null;
  const net = networkKey ? NETWORKS[networkKey] : null;
  const c = {
    networkKey,
    network: net,
    rpc: e.TOKEN_RPC_URL || net?.rpc || null,
    token: addr(e.TOKEN_ADDRESS),
    vesting: addr(e.TOKEN_VESTING_ADDRESS),
    liquidity: addr(e.TOKEN_LIQUIDITY_WALLET),
    pair: addr(e.TOKEN_LP_PAIR),
    reserve: addr(e.TOKEN_BURN_RESERVE_WALLET), // cold wallet holding the rest of the 20% (key never here)
    hasBurnKey: Boolean(e.TOKEN_BURN_WALLET_KEY),
    perRating: Number.isFinite(Number(e.TOKEN_BURN_PER_RATING)) && Number(e.TOKEN_BURN_PER_RATING) > 0 ? Number(e.TOKEN_BURN_PER_RATING) : 10,
    maxPerDay: Number(e.TOKEN_MAX_BURN_PER_DAY) > 0 ? Number(e.TOKEN_MAX_BURN_PER_DAY) : 500_000,
    startDay: /^\d{4}-\d{2}-\d{2}$/.test(e.TOKEN_BURN_START || "") ? e.TOKEN_BURN_START : null,
    ownersTold: e.NEXT_PUBLIC_TOKEN_TERMS === "on",
    legalOk: e.TOKEN_LEGAL_OK === "yes",
  };
  const problems = [];
  if (!networkKey) problems.push("TOKEN_NETWORK is not set (local, bsc-testnet or bsc)");
  if (!c.token) problems.push("TOKEN_ADDRESS is not set");
  if (!c.hasBurnKey) problems.push("TOKEN_BURN_WALLET_KEY is not set");
  if (!c.startDay) problems.push("TOKEN_BURN_START (first day to burn, YYYY-MM-DD) is not set");
  if (net?.real && !c.legalOk) problems.push("Real network: set TOKEN_LEGAL_OK=yes only after your lawyer and CA approve");
  if (net?.real && !c.ownersTold) problems.push("Real network: owners must be told first (NEXT_PUBLIC_TOKEN_TERMS=on, then they agree to the new Terms)");
  c.configured = Boolean(networkKey && c.token);
  c.canBurn = problems.length === 0;
  c.problems = problems;
  return c;
}

export const explorerTx = (c, hash) => (c.network?.explorer && hash ? `${c.network.explorer}/tx/${hash}` : null);
export const explorerAddress = (c, a) => (c.network?.explorer && a ? `${c.network.explorer}/address/${a}` : null);

function chain(c) {
  const provider = new JsonRpcProvider(c.rpc, c.network.chainId, { staticNetwork: true });
  const token = new Contract(c.token, TOKEN_ABI, provider);
  return { provider, token };
}

function burnWallet(c, provider) {
  return new Wallet(process.env.TOKEN_BURN_WALLET_KEY, provider);
}

/** Real ratings on one Indian day, all shops together (new ratings only; one per phone per shop). */
export async function ratingsOnDay(dayKey) {
  await ensureAllDailyCounts();
  const [row] = await ShopDay.aggregate([
    { $match: { day: dayKey } },
    { $group: { _id: null, n: { $sum: { $add: ["$happy", "$unhappy"] } } } },
  ]);
  return row?.n || 0;
}

/** Days that should be burned now: from the start day up to yesterday, not yet done. Oldest first. */
async function dueDays(c) {
  const yesterday = addDaysKey(istDayKey(new Date()), -1);
  if (!c.startDay || c.startDay > yesterday) return [];
  const from = c.startDay < addDaysKey(yesterday, -60) ? addDaysKey(yesterday, -60) : c.startDay;
  const all = dayKeysBetween(from, yesterday);
  const done = await TokenBurn.find({ _id: { $in: all }, status: { $in: ["confirmed", "skipped", "sent"] } }).select("_id").lean();
  const skip = new Set(done.map((d) => d._id));
  return all.filter((d) => !skip.has(d)).slice(0, MAX_CATCH_UP_DAYS);
}

/** Burn one day. Safe to call again for the same day: it never burns twice. */
export async function burnDay(dayKey, c = tokenConfig()) {
  if (!c.canBurn) return { day: dayKey, status: "blocked", problems: c.problems };
  await connectDB();
  const { provider, token } = chain(c);
  const wallet = burnWallet(c, provider);
  const now = new Date();

  // 1. Create the day's record once (the day's ratings are final by now).
  let doc = await TokenBurn.findById(dayKey).lean();
  if (!doc) {
    const ratings = await ratingsOnDay(dayKey);
    const tokens = Math.min(ratings * c.perRating, c.maxPerDay);
    try {
      await TokenBurn.create({
        _id: dayKey,
        network: c.networkKey,
        ratings,
        tokens,
        status: tokens > 0 ? "pending" : "skipped",
        note: tokens > 0 ? (tokens < ratings * c.perRating ? `capped at ${c.maxPerDay} tokens` : undefined) : "no ratings",
      });
    } catch (err) {
      if (err?.code !== 11000) throw err; // another run created it at the same moment
    }
    doc = await TokenBurn.findById(dayKey).lean();
  }
  if (["confirmed", "skipped", "sent"].includes(doc.status)) return { day: dayKey, status: doc.status, tokens: doc.tokens };

  // 2. Claim the day for 2 minutes, so two runs never work on it together.
  const claimed = await TokenBurn.findOneAndUpdate(
    { _id: dayKey, status: { $in: ["pending", "failed"] }, $or: [{ lockUntil: null }, { lockUntil: { $lt: now } }] },
    { $set: { lockUntil: new Date(now.getTime() + 2 * 60_000) } },
    { new: true }
  ).lean();
  if (!claimed) return { day: dayKey, status: "busy" };

  const set = (fields) => TokenBurn.updateOne({ _id: dayKey }, { $set: { ...fields, lockUntil: null } });
  try {
    // 3. A transaction was already sent for this day: just check on it.
    if (claimed.txHash) {
      const receipt = await provider.getTransactionReceipt(claimed.txHash);
      if (receipt) {
        if (receipt.status === 1) {
          await set({ status: "confirmed", blockNumber: receipt.blockNumber, error: null });
          return { day: dayKey, status: "confirmed", tokens: claimed.tokens, txHash: claimed.txHash };
        }
        // It ran but failed: that transaction number is used up, so start again with a new one.
        await TokenBurn.updateOne({ _id: dayKey }, { $unset: { txHash: 1, nonce: 1 } });
        claimed.txHash = null;
        claimed.nonce = null;
      } else {
        const mined = await provider.getTransactionCount(wallet.address, "latest");
        if (claimed.nonce != null && mined > claimed.nonce) {
          // Its transaction number was used by a transaction we can't see (e.g. replaced): needs a look.
          await set({ status: "sent", note: "transaction number used; check the burn wallet on BscScan" });
          return { day: dayKey, status: "sent" };
        }
        await set({});
        return { day: dayKey, status: "waiting", txHash: claimed.txHash };
      }
    }

    // 4. Reserve this day's transaction number before sending anything.
    let nonce = claimed.nonce;
    if (nonce == null) {
      nonce = await provider.getTransactionCount(wallet.address, "pending");
      await TokenBurn.updateOne({ _id: dayKey }, { $set: { nonce } });
    } else if ((await provider.getTransactionCount(wallet.address, "latest")) > nonce) {
      await set({ status: "sent", note: "a transaction with this number was already mined; check BscScan" });
      return { day: dayKey, status: "sent" };
    }

    // 5. Never burn more than the pool holds.
    const pool = await token.balanceOf(wallet.address);
    let amount = parseEther(String(claimed.tokens));
    if (amount > pool) amount = pool;
    if (amount === 0n) {
      await set({ status: "skipped", note: "burn pool is empty" });
      return { day: dayKey, status: "skipped" };
    }

    // 6. Send, save the hash at once, then wait for the block.
    const tx = await token.connect(wallet).burn(amount, { nonce });
    await TokenBurn.updateOne({ _id: dayKey }, { $set: { txHash: tx.hash } });
    const receipt = await tx.wait(1, 90_000);
    if (receipt?.status === 1) {
      await set({ status: "confirmed", blockNumber: receipt.blockNumber, error: null, tokens: Number(formatEther(amount)) });
      return { day: dayKey, status: "confirmed", tokens: Number(formatEther(amount)), txHash: tx.hash };
    }
    await set({ status: "failed", error: "transaction failed on the blockchain" });
    return { day: dayKey, status: "failed" };
  } catch (err) {
    const msg = String(err?.shortMessage || err?.message || err).slice(0, 300);
    await set({ status: "failed", error: msg });
    return { day: dayKey, status: "failed", error: msg };
  }
}

/** The daily job: burn every due day, oldest first. Stops at the first failure. */
export async function runDailyBurns() {
  const c = tokenConfig();
  if (!c.configured) return { status: "off" };
  if (!c.canBurn) return { status: "blocked", problems: c.problems };
  await connectDB();
  const results = [];
  for (const day of await dueDays(c)) {
    const r = await burnDay(day, c);
    results.push(r);
    if (!["confirmed", "skipped"].includes(r.status)) break;
  }
  return { status: "ok", results };
}

const whole = (wei) => Number(formatEther(wei));

/** Everything the admin Token tab shows. */
export async function getTokenStatus() {
  const c = tokenConfig();
  await connectDB();
  const burns = await TokenBurn.find().sort({ _id: -1 }).limit(60).lean();
  const base = { config: c, burns, chain: null, error: null };
  if (!c.configured) return base;
  try {
    const { provider, token } = chain(c);
    const burnAddr = c.hasBurnKey ? burnWallet(c, provider).address : null;
    const vesting = c.vesting ? new Contract(c.vesting, VESTING_ABI, provider) : null;
    const bal = (a) => (a ? token.balanceOf(a).then(whole) : null);
    const [supply, symbol, vestBal, liqBal, pairBal, reserveBal, burnBal, burnGas, released, releasable, start, duration, cliff, beneficiary] = await Promise.all([
      token.totalSupply().then(whole),
      token.symbol(),
      bal(c.vesting),
      bal(c.liquidity),
      bal(c.pair),
      bal(c.reserve),
      bal(burnAddr),
      burnAddr ? provider.getBalance(burnAddr).then(whole) : null,
      vesting ? vesting.released(c.token).then(whole) : null,
      vesting ? vesting.releasable(c.token).then(whole) : null,
      vesting ? vesting.start().then(Number) : null,
      vesting ? vesting.duration().then(Number) : null,
      vesting ? vesting.cliff().then(Number) : null,
      vesting ? vesting.owner() : null,
    ]);
    base.chain = {
      symbol,
      supply,
      burned: INITIAL_SUPPLY - supply,
      burnWallet: burnAddr,
      burnPool: burnBal,
      reserve: reserveBal,
      burnGasBnb: burnGas,
      lowGas: burnGas != null && burnGas < LOW_GAS_BNB,
      liquidity: liqBal,
      pair: pairBal,
      vesting: vesting
        ? { locked: vestBal, released, releasable, start, end: start + duration, cliff, beneficiary }
        : null,
    };
  } catch (err) {
    base.error = String(err?.shortMessage || err?.message || err).slice(0, 300);
  }
  return base;
}
