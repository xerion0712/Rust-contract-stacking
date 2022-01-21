import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { CwarPoolData, UserData } from ".";
import { Pubkeys } from "../constants";
import { getStakingVaultBalanceRaw } from "../data";
import { getUserStorageAccount } from "../utils";



export async function getUserPendingRewards(userWallet: PublicKey): Promise<number> {
    const U64_MAX = new BN("18446744073709551615", 10);
    let cwarPoolData = await CwarPoolData.fromAccount(Pubkeys.yourPoolStoragePubkey);
    if (cwarPoolData == null) {
        throw new Error("Pool Does Not Exist");
    }
    let userDataStorageAddress = await getUserStorageAccount(userWallet);
    let userData = await UserData.fromAccount(userDataStorageAddress);
    if (userData == null) {
        return 0;
    }
    let totalTokensStakedRaw = await getStakingVaultBalanceRaw();
    let lastApplicableTime = Math.min(Math.floor(Date.now() / 1000), cwarPoolData.rewardDurationEnd.toNumber());
    let timeElasped = new BN(lastApplicableTime - cwarPoolData.totalStakeLastUpdateTime.toNumber());
    let currentRewardPerToken = cwarPoolData.rewardPerTokenStored.add(timeElasped.mul(cwarPoolData.rewardRate).mul(U64_MAX).div(new BN(totalTokensStakedRaw)));
    let userPendingRewards = userData.balanceStaked.mul(currentRewardPerToken.sub(userData.rewardsPerTokenCompleted).div(U64_MAX).add(userData.rewardPerTokenPending)).toNumber();
    return userPendingRewards;
}