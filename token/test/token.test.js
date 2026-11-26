const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const T = (n) => ethers.parseEther(String(n)); // whole tokens -> 18-decimal units
const SUPPLY = T(1_000_000_000);
const MONTH = 30 * 24 * 60 * 60;

async function deploy() {
  const [deployer, team, liquidity, burnPool, stranger] = await ethers.getSigners();
  const start = (await time.latest()) + 60;
  const vesting = await ethers.deployContract("TeamVesting", [team.address, start, 24 * MONTH, 6 * MONTH]);
  const token = await ethers.deployContract("ReviewBoosterToken", [
    await vesting.getAddress(),
    liquidity.address,
    burnPool.address,
  ]);
  return { token, vesting, start, deployer, team, liquidity, burnPool, stranger };
}

describe("ReviewBoosterToken", () => {
  it("has the right name, symbol and 18 decimals", async () => {
    const { token } = await deploy();
    expect(await token.name()).to.equal("Review Booster Token");
    expect(await token.symbol()).to.equal("RBT");
    expect(await token.decimals()).to.equal(18n);
  });

  it("creates exactly 100 crore tokens split 50 / 30 / 20", async () => {
    const { token, vesting, liquidity, burnPool, deployer } = await deploy();
    expect(await token.totalSupply()).to.equal(SUPPLY);
    expect(await token.balanceOf(await vesting.getAddress())).to.equal(T(500_000_000));
    expect(await token.balanceOf(liquidity.address)).to.equal(T(300_000_000));
    expect(await token.balanceOf(burnPool.address)).to.equal(T(200_000_000));
    expect(await token.balanceOf(deployer.address)).to.equal(0n); // the deployer keeps nothing
  });

  it("can never create more tokens: no mint, no owner", async () => {
    const { token } = await deploy();
    const fns = token.interface.fragments.filter((f) => f.type === "function").map((f) => f.name);
    expect(fns).to.not.include("mint");
    expect(fns).to.not.include("owner");
    expect(fns).to.not.include("pause");
  });

  it("refuses a zero address for any of the three wallets", async () => {
    const [, a, b] = await ethers.getSigners();
    const Z = ethers.ZeroAddress;
    await expect(ethers.deployContract("ReviewBoosterToken", [Z, a.address, b.address])).to.be.revertedWith("RBT: team vesting is zero");
    await expect(ethers.deployContract("ReviewBoosterToken", [a.address, Z, b.address])).to.be.revertedWith("RBT: liquidity wallet is zero");
    await expect(ethers.deployContract("ReviewBoosterToken", [a.address, b.address, Z])).to.be.revertedWith("RBT: burn pool is zero");
  });

  it("burn pool burns its own tokens: supply goes down for good", async () => {
    const { token, burnPool } = await deploy();
    await expect(token.connect(burnPool).burn(T(42_100)))
      .to.emit(token, "Transfer")
      .withArgs(burnPool.address, ethers.ZeroAddress, T(42_100));
    expect(await token.totalSupply()).to.equal(SUPPLY - T(42_100));
    expect(await token.balanceOf(burnPool.address)).to.equal(T(200_000_000) - T(42_100));
  });

  it("nobody can burn someone else's tokens", async () => {
    const { token, burnPool, stranger } = await deploy();
    await expect(token.connect(stranger).burnFrom(burnPool.address, T(1))).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    await expect(token.connect(stranger).burn(T(1))).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
  });

  it("transfers normally with no hidden fee", async () => {
    const { token, liquidity, stranger } = await deploy();
    await token.connect(liquidity).transfer(stranger.address, T(1000));
    expect(await token.balanceOf(stranger.address)).to.equal(T(1000));
  });
});

describe("TeamVesting (the team's 50%)", () => {
  it("releases nothing before the 6-month cliff", async () => {
    const { token, vesting, start, team } = await deploy();
    await time.increaseTo(start + 6 * MONTH - 10);
    expect(await vesting["releasable(address)"](await token.getAddress())).to.equal(0n);
    await vesting["release(address)"](await token.getAddress());
    expect(await token.balanceOf(team.address)).to.equal(0n);
  });

  it("after the cliff, releases in a straight line (half at 12 of 24 months)", async () => {
    const { token, vesting, start, team } = await deploy();
    await time.increaseTo(start + 12 * MONTH);
    await vesting["release(address)"](await token.getAddress());
    const got = await token.balanceOf(team.address);
    // 12/24 of 50 crore = 25 crore (allow one block of drift)
    expect(got).to.be.closeTo(T(250_000_000), T(10));
  });

  it("everything is released after 24 months, only to the team wallet", async () => {
    const { token, vesting, start, team, stranger } = await deploy();
    await time.increaseTo(start + 24 * MONTH + 1);
    await vesting.connect(stranger)["release(address)"](await token.getAddress()); // anyone may trigger it...
    expect(await token.balanceOf(team.address)).to.equal(T(500_000_000)); // ...but it only goes to the team
    expect(await token.balanceOf(stranger.address)).to.equal(0n);
    expect(await token.balanceOf(await vesting.getAddress())).to.equal(0n);
  });

  it("shows its schedule publicly", async () => {
    const { vesting, start, team } = await deploy();
    expect(await vesting.owner()).to.equal(team.address);
    expect(await vesting.start()).to.equal(BigInt(start));
    expect(await vesting.duration()).to.equal(BigInt(24 * MONTH));
    expect(await vesting.cliff()).to.equal(BigInt(start + 6 * MONTH));
  });
});
