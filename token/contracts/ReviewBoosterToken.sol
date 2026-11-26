// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title Review Booster Token (RBT)
 * @notice Fixed supply of 100 crore (1,000,000,000) tokens, all created once
 *         at deployment and split three ways:
 *           50%  team: `teamUnlocked` straight to the team wallet, the rest
 *                to a time-lock vesting contract (released slowly)
 *           30%  liquidity wallet (for the PancakeSwap pool)
 *           20%  burn pool wallet (burned bit by bit, publicly, over time)
 * @dev    Deliberately plain: no owner, no minting after deployment, no
 *         transfer fees, no blacklist, no pause. Anyone can burn their own
 *         tokens (ERC20Burnable). Built only from audited OpenZeppelin code.
 */
contract ReviewBoosterToken is ERC20, ERC20Burnable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether; // 18 decimals
    uint256 public constant TEAM_SHARE = (INITIAL_SUPPLY * 50) / 100;

    /// @notice How much of the team's 50% was free at launch (the rest is time-locked).
    uint256 public immutable teamUnlockedAtLaunch;

    constructor(
        address teamVesting,
        address teamWallet,
        uint256 teamUnlocked,
        address liquidityWallet,
        address burnPool
    ) ERC20("Review Booster Token", "RBT") {
        require(teamVesting != address(0), "RBT: team vesting is zero");
        require(liquidityWallet != address(0), "RBT: liquidity wallet is zero");
        require(burnPool != address(0), "RBT: burn pool is zero");
        require(teamUnlocked <= TEAM_SHARE, "RBT: unlocked part is more than the team share");
        require(teamUnlocked == 0 || teamWallet != address(0), "RBT: team wallet is zero");

        teamUnlockedAtLaunch = teamUnlocked;
        if (teamUnlocked > 0) _mint(teamWallet, teamUnlocked);
        _mint(teamVesting, TEAM_SHARE - teamUnlocked);
        _mint(liquidityWallet, (INITIAL_SUPPLY * 30) / 100);
        _mint(burnPool, (INITIAL_SUPPLY * 20) / 100);
    }
}
