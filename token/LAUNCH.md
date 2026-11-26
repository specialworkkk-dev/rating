# Review Booster Token (RBT): launch guide

From nothing to a live token on PancakeSwap, step by step. **Do the steps in
order.** Steps 1–4 use the free BNB *test* network (fake money). Step 5 onwards
is real money and only happens after Step 0.

**The token**

- **Name and network:** Review Booster Token (RBT), on BNB Smart Chain (BEP-20).
- **Supply:** 100 crore (1,000,000,000), all created once. No one can ever create more.
- **50% team:** **50 lakh** go straight to the Team wallet at launch. The other **49.5 crore** go into a public time-lock contract (TeamVesting): nothing unlocks for 6 months, then a quarter unlocks at once and the rest steadily until month 24.
- **30% liquidity:** for the PancakeSwap pool.
- **20% burn pool:** burned at 10 RBT per real customer rating, once a day.

---

## Step 0: before any real money (you)

1. **Lawyer and CA.** Show them this plan. Ask about:
   - who should own the token (you or a company);
   - the 30% tax and 1% TDS on crypto;
   - registering with FIU-IND (anti-money-laundering);
   - whether selling team tokens over time is allowed, and how to report it.

   Keep their written OK.
2. **Write the public token document.** It should state:
   - the 50/30/20 split and all contract addresses, including "Team: 50 lakh free at launch, 49.5 crore locked";
   - the team lock dates;
   - the burn rule ("10 RBT per real rating, daily, from the burn pool");
   - **no promise of any price**.
3. **Budget for the launch.** You need:
   - **BNB for transaction fees:** small, often well under 0.05 BNB in total, but check the fees on the day;
   - **the BNB you will put into the PancakeSwap pool next to the 30%.** That BNB sets the starting price and is at risk.

## Step 1: make the wallets (you, in MetaMask)

Create **five** separate wallets. Write each **secret recovery phrase on paper**
and keep it offline. **Never** paste a phrase or private key into a chat, an
email or a screenshot.

| Wallet | What it does | Where its key lives |
|---|---|---|
| **Deployer** | Pays the fees to create the contracts; ends up holding nothing | Only on your computer, only while deploying |
| **Team** | Receives your 50% as it unlocks | Best on a hardware wallet (Ledger/Trezor). Never on a server |
| **Liquidity** | Holds the 30%, then adds it to PancakeSwap | Your MetaMask |
| **Burn reserve (cold)** | Receives the 20% at creation; you top up the burn wallet from it | Your MetaMask or a hardware wallet. Never on a server |
| **Burn (hot)** | Burns the tokens each night | **The only key on the server** (Vercel). Keep just 1–2 months of burns in it |

Why the reserve: if the server were ever hacked, only what's in the hot burn
wallet could be taken, not all 20 crore.

## Step 2: try everything on the test network (you + this code)

1. In MetaMask, add **BNB Smart Chain Testnet**. The admin Token page's "Switch network" button does this.
2. Get free **test BNB** for the Deployer and Burn wallets from the official BNB Chain testnet faucet (search "BNB Chain testnet faucet").
3. Create the file `token/.env` (it's never uploaded to GitHub):

   ```
   DEPLOYER_KEY=0x...            # Deployer wallet private key (testnet use)
   TEAM_WALLET=0x...
   TEAM_UNLOCKED_NOW=5000000     # 50 lakh free at launch (0 = all locked)
   LIQUIDITY_WALLET=0x...
   BURN_WALLET=0x...             # the burn RESERVE (cold) wallet's address
   VEST_CLIFF_MONTHS=6
   VEST_MONTHS=24
   ETHERSCAN_API_KEY=...         # free key from etherscan.io (works for BscScan)
   ```

4. In a terminal, run `cd token && npm install && npm test`. All tests must pass.
5. Then run `npm run deploy:testnet`. It prints the token address, the team lock address and two `npx hardhat verify ...` commands.
6. Run both verify commands. The contract code is then public and readable on testnet.bscscan.com.
7. From the burn reserve wallet, **send a small amount of RBT to the hot burn wallet** (for example 1,00,000), plus a little test BNB for fees.

## Step 3: connect the app on the test network (you, in Vercel)

1. In Vercel → Settings → Environment Variables, add these. Use type **Secret** for the key; the rest can be **Config**.

   ```
   TOKEN_NETWORK=bsc-testnet
   TOKEN_ADDRESS=0x...                  (printed by the deploy)
   TOKEN_VESTING_ADDRESS=0x...          (printed by the deploy)
   TOKEN_LIQUIDITY_WALLET=0x...
   TOKEN_BURN_RESERVE_WALLET=0x...
   TOKEN_BURN_WALLET_KEY=0x...          (hot burn wallet private key, Secret)
   TOKEN_BURN_START=2026-12-01          (first day to burn, YYYY-MM-DD)
   TOKEN_BURN_PER_RATING=10
   ```

2. Redeploy. Then open **Admin → Token**. You should see the supply, the team lock and the wallets.
3. The night after TOKEN_BURN_START, the first burn runs by itself. You can also press **Run burn now**.
4. Click the transaction links and check each burn on testnet.bscscan.com.

## Step 4: tell the shop owners (still before mainnet)

1. In **Admin → Token → Switches**, turn on **"Owners told"**. It takes effect at once, with no redeploy.
2. The Terms of Service now include a "Review Booster Token" section. **Every owner is asked to agree again** on their dashboard.
3. The admin Shops list shows "terms not agreed" until each owner has agreed.

Customers see nothing: no token wording anywhere on the rating pages.

## Step 5: real launch on BNB Smart Chain (only after Step 0)

1. In `token/.env`:
   - change `DEPLOYER_KEY` to the real Deployer wallet;
   - add `LEGAL_OK=yes` and `CONFIRM_MAINNET=yes`.

   The deploy script refuses the real network without both.
2. Put real BNB in the Deployer wallet for fees.
3. Run `npm run deploy:mainnet`, then run both `npx hardhat verify ...` commands. The contracts are now readable on bscscan.com.
4. **Check on BscScan before anything else:**
   - total supply is 1,000,000,000;
   - the Team wallet holds 50 lakh and the TeamVesting contract holds 49.5 crore;
   - the Liquidity wallet holds 30%;
   - the burn reserve holds 20%.
5. **Empty the Deployer wallet.** It should hold no RBT. Send any leftover BNB to the Liquidity wallet.

## Step 6: add the PancakeSwap pool (you, from the Liquidity wallet)

1. Open pancakeswap.finance and connect the **Liquidity** wallet (BNB Smart Chain).
2. Go to Liquidity → Add liquidity. Choose **BNB** and paste the **RBT token address**. Don't pick RBT by name: fake copies with the same name exist.
3. Enter how much RBT and how much BNB to add.
   - **Starting price = BNB added ÷ RBT added.** Example: 30 crore RBT with 10 BNB gives about 0.000000033 BNB per RBT.
4. Confirm. You receive "LP tokens", which are your share of the pool.
5. **Lock the LP tokens** with a well-known, public liquidity-locker service. Check its reputation first. Publish the lock link, so buyers can see you can't pull the pool out.
6. Find the pool (pair) address on BscScan and add it in Vercel as `TOKEN_LP_PAIR`. The Token page then shows the pool.

## Step 7: switch the app to the real network (you, in Vercel)

1. Change these settings:

   ```
   TOKEN_NETWORK=bsc
   TOKEN_ADDRESS / TOKEN_VESTING_ADDRESS / wallets   (the real ones)
   TOKEN_BURN_WALLET_KEY=0x...    (real hot burn wallet, Secret)
   TOKEN_BURN_START=<launch day>
   ```

2. In **Admin → Token → Switches**:
   - keep **"Owners told"** on;
   - turn on **"Lawyer & CA approved"** (type APPROVED), only with their written OK.

   Both switches are recorded with your email and the time.
3. Fund the hot burn wallet:
   - send 1–2 months of burns from the reserve (example: 5,000 ratings a day × 10 × 60 days = 30,00,000 RBT);
   - send a little BNB for fees.
4. Redeploy. **Admin → Token** shows "BNB Smart Chain (real money)" and should list no problems.

## Every week / month

- **Admin → Token:**
  - if the burn wallet shows fewer than 14 days of burns, top it up from the reserve;
  - if the gas shows "Low", add a little BNB.
- To stop burning at any moment, use **Admin → Token → "Pause daily burns"**. Days missed while paused are burned afterwards, up to 7 per night.
- A day marked **"Check BscScan"** means a crash happened mid-burn. Open the burn wallet on BscScan and confirm the burn for that day happened once. The app never sends a second burn for the same day.
- **Team tokens:**
  - after the cliff, open the TeamVesting contract on BscScan → Write Contract → `release(token)`, and the unlocked part goes to the Team wallet;
  - sell slowly and in small amounts, as you planned;
  - keep records for your CA (TDS and tax).
- Download the app's database backup weekly (Admin → Services). Burn records are in it.

## Never

- Never put the Team, Deployer or Reserve keys on a server, in GitHub, or in a chat.
- Never promise anyone that RBT's price will rise.
- Never mention RBT on the rating page or link any reward to ratings or reviews. Google would treat it as a paid review and block the shop's reviews.
