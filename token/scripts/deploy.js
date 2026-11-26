// Deploys TeamVesting (the team's 50%, time-locked) and then the token.
//   npm run deploy:local     (a local test chain: `npm run node` in another terminal)
//   npm run deploy:testnet   (BNB test network, free test BNB)
//   npm run deploy:mainnet   (real money; refuses unless LAUNCH.md step 0 is done)
// Settings come from token/.env, see LAUNCH.md.
const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");
const { ethers, network } = hre;

const MONTH = 30 * 24 * 60 * 60;

function need(name) {
  const v = process.env[name];
  if (!v || !ethers.isAddress(v)) throw new Error(`Set ${name} in token/.env to a wallet address (0x...)`);
  return ethers.getAddress(v);
}

async function main() {
  if (network.name === "bsc") {
    if (process.env.LEGAL_OK !== "yes") throw new Error("Mainnet refused: a lawyer and CA must approve first (set LEGAL_OK=yes in token/.env).");
    if (process.env.CONFIRM_MAINNET !== "yes") throw new Error("Mainnet refused: set CONFIRM_MAINNET=yes in token/.env to confirm a real-money deployment.");
  }

  const [deployer] = await ethers.getSigners();
  const local = network.name === "localhost" || network.name === "hardhat";
  const signers = local ? await ethers.getSigners() : [];
  // On a local test chain, Hardhat's built-in test accounts stand in for the wallets.
  const team = local ? process.env.TEAM_WALLET || signers[1].address : need("TEAM_WALLET");
  const liquidity = local ? process.env.LIQUIDITY_WALLET || signers[2].address : need("LIQUIDITY_WALLET");
  // The 20% burn pool goes to a cold "burn reserve" wallet (its key never on a
  // server); a month or two at a time is moved to the app's burn wallet.
  const burnPool = local ? process.env.BURN_WALLET || signers[3].address : need("BURN_WALLET");
  if (new Set([team, liquidity, burnPool]).size !== 3) throw new Error("TEAM_WALLET, LIQUIDITY_WALLET and BURN_WALLET must be three different wallets");

  const now = Math.floor(Date.now() / 1000);
  const start = Number(process.env.VEST_START || now);
  const cliffMonths = Number(process.env.VEST_CLIFF_MONTHS || 6);
  const months = Number(process.env.VEST_MONTHS || 24);
  if (!(months > 0) || !(cliffMonths >= 0) || cliffMonths > months) throw new Error("VEST_CLIFF_MONTHS must be between 0 and VEST_MONTHS");

  const bnb = ethers.formatEther(await ethers.provider.getBalance(deployer.address));
  console.log(`Network: ${network.name} (chain ${network.config.chainId ?? "local"})`);
  console.log(`Deployer: ${deployer.address}  balance ${bnb} BNB`);
  console.log(`Team 50% locked for ${cliffMonths} months, then released until month ${months} -> ${team}`);
  console.log(`Liquidity 30% -> ${liquidity}`);
  console.log(`Burn pool 20% -> ${burnPool}`);

  const vesting = await ethers.deployContract("TeamVesting", [team, start, months * MONTH, cliffMonths * MONTH]);
  await vesting.waitForDeployment();
  const token = await ethers.deployContract("ReviewBoosterToken", [await vesting.getAddress(), liquidity, burnPool]);
  await token.waitForDeployment();

  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    token: await token.getAddress(),
    teamVesting: await vesting.getAddress(),
    teamWallet: team,
    liquidityWallet: liquidity,
    burnWallet: burnPool,
    vesting: { start, cliffMonths, months },
    deployedAt: new Date().toISOString(),
    tx: { token: token.deploymentTransaction()?.hash, teamVesting: vesting.deploymentTransaction()?.hash },
  };
  const file = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\nToken:        ${out.token}\nTeam vesting: ${out.teamVesting}\nSaved to ${path.relative(process.cwd(), file)}`);
  if (!local) {
    console.log(`\nPublish the code on BscScan (needs ETHERSCAN_API_KEY in token/.env):`);
    console.log(`npx hardhat verify --network ${network.name} ${out.teamVesting} ${team} ${start} ${months * MONTH} ${cliffMonths * MONTH}`);
    console.log(`npx hardhat verify --network ${network.name} ${out.token} ${out.teamVesting} ${liquidity} ${burnPool}`);
  }
  console.log(`\nFor the web app (.env.local / Vercel):\nTOKEN_NETWORK=${network.name === "bsc" ? "bsc" : network.name === "bscTestnet" ? "bsc-testnet" : "local"}\nTOKEN_ADDRESS=${out.token}\nTOKEN_VESTING_ADDRESS=${out.teamVesting}\nTOKEN_LIQUIDITY_WALLET=${liquidity}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
