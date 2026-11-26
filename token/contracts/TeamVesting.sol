// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";
import {VestingWalletCliff} from "@openzeppelin/contracts/finance/VestingWalletCliff.sol";

/**
 * @title TeamVesting
 * @notice Holds the team's 50% and releases it slowly, in public:
 *         nothing before the cliff, then a straight line until `duration`
 *         has passed since `start`. Anyone can read the schedule on BscScan.
 * @dev    OpenZeppelin VestingWallet + cliff, unchanged.
 */
contract TeamVesting is VestingWalletCliff {
    constructor(address beneficiary, uint64 startTimestamp, uint64 durationSeconds, uint64 cliffSeconds)
        VestingWallet(beneficiary, startTimestamp, durationSeconds)
        VestingWalletCliff(cliffSeconds)
    {}
}
