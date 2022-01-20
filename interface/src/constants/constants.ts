import BN from "bn.js";

/**
 * General constants
 */
export class Constants {
  static cwarDecimals = 9;

  static toCwarRaw = Math.pow(10, Constants.cwarDecimals);

  static maxCwarSupply = new BN(1000_000_000).mul(new BN(Constants.toCwarRaw));

  static rewardTokenDecimals = 9;

  static toRewardTokenRaw = Math.pow(10, Constants.rewardTokenDecimals);

}
