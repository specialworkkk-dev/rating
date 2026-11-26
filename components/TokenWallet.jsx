"use client";

import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, card } from "./ui";

// MetaMask (or any browser wallet) for the admin: connect, check the network,
// add RBT to the wallet and see this wallet's RBT balance. Read-only: this page
// never asks the wallet to send or sign anything.

const hex = (n) => `0x${Number(n).toString(16)}`;
const CHAIN_PARAMS = {
  97: {
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
    rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"],
  },
  56: {
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.bnbchain.org"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
};

/** balanceOf(address) without a library: selector 0x70a08231 + the address padded to 32 bytes. */
async function rbtBalance(eth, token, account) {
  const data = `0x70a08231${account.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
  const raw = await eth.request({ method: "eth_call", params: [{ to: token, data }, "latest"] });
  const wei = BigInt(raw === "0x" ? 0 : raw);
  return Number(wei / 10n ** 14n) / 1e4; // whole tokens, 4 decimals
}

export default function TokenWallet({ token, chainId, symbol = "RBT" }) {
  const [eth, setEth] = useState(null);
  const [account, setAccount] = useState("");
  const [walletChain, setWalletChain] = useState(null);
  const [balance, setBalance] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const e = typeof window !== "undefined" ? window.ethereum : null;
    if (!e) return;
    setEth(e);
    e.request({ method: "eth_accounts" }).then((a) => setAccount(a[0] || "")).catch(() => {});
    e.request({ method: "eth_chainId" }).then((c) => setWalletChain(parseInt(c, 16))).catch(() => {});
    const onAcc = (a) => setAccount(a[0] || "");
    const onChain = (c) => setWalletChain(parseInt(c, 16));
    e.on?.("accountsChanged", onAcc);
    e.on?.("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAcc);
      e.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const rightChain = walletChain === chainId;
  useEffect(() => {
    if (!eth || !account || !rightChain || !token) return setBalance(null);
    rbtBalance(eth, token, account).then(setBalance).catch(() => setBalance(null));
  }, [eth, account, rightChain, token]);

  async function connect() {
    setMsg("");
    try {
      const a = await eth.request({ method: "eth_requestAccounts" });
      setAccount(a[0] || "");
    } catch {
      setMsg("Connection was cancelled in the wallet.");
    }
  }

  async function switchChain() {
    setMsg("");
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex(chainId) }] });
    } catch (err) {
      if (err?.code === 4902 && CHAIN_PARAMS[chainId]) {
        await eth.request({ method: "wallet_addEthereumChain", params: [{ chainId: hex(chainId), ...CHAIN_PARAMS[chainId] }] }).catch(() => setMsg("Couldn’t add the network."));
      } else setMsg("Couldn’t switch network in the wallet.");
    }
  }

  async function addToken() {
    setMsg("");
    try {
      await eth.request({ method: "wallet_watchAsset", params: { type: "ERC20", options: { address: token, symbol, decimals: 18 } } });
    } catch {
      setMsg("The wallet didn’t add the token.");
    }
  }

  return (
    <section className={`${card} space-y-3`}>
      <div>
        <h2 className="font-semibold">Your wallet</h2>
        <p className="text-xs text-muted">View only: this page never asks your wallet to send or sign anything.</p>
      </div>
      {!eth ? (
        <p className="text-sm text-muted">
          No browser wallet found. Install MetaMask (on a computer, or use the MetaMask app’s built-in browser on a phone), then reload this page.
        </p>
      ) : !account ? (
        <button type="button" onClick={connect} className={btnPrimary}>
          Connect MetaMask
        </button>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="break-all">
            Connected: <span className="font-mono">{account}</span>
          </p>
          {!rightChain ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-amber-800">⚠ Your wallet is on another network.</span>
              <button type="button" onClick={switchChain} className={btnSecondary}>
                Switch network
              </button>
            </div>
          ) : (
            <p>
              {symbol} in this wallet: <b className="tabular-nums">{balance == null ? "…" : balance.toLocaleString("en-IN")}</b>
            </p>
          )}
          {token && (
            <button type="button" onClick={addToken} className={btnSecondary}>
              Add {symbol} to MetaMask
            </button>
          )}
        </div>
      )}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </section>
  );
}
