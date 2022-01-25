import {ConnectionService} from "../src/config";
import {
    createUserTransaction,
    closeUserTransaction,
    closePoolTransaction,
    stakeYourTransaction,
    unstakeYourTransaction, claimRewardsTransaction, createInitializePoolTransaction
} from "../src/transactions";
import {setupTest, timeout} from './testHelpers';
import {
    adminAccount,
    setupEnvironment,
    walletAccount,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    rewardDurationInDays,

} from "./prepereTestsEvironment";
import {sendAndConfirmTransaction} from "@solana/web3.js";

setupTest();

describe('Your Token Staking Tests', () => {

    beforeAll(async () => {
        await setupEnvironment();
    });

    test('Initialize Pool', async () => {
        const connection = ConnectionService.getConnection();
        const initializePoolTx = await createInitializePoolTransaction(
            adminAccount.publicKey,
            yourPoolStorageAccount,
            yourStakingVault,
            yourRewardsVault,
            rewardDurationInDays,
            10000
        );
        await sendAndConfirmTransaction(connection, initializePoolTx, [
            adminAccount,
            yourPoolStorageAccount,
            yourStakingVault,
            yourRewardsVault,
        ]);
    });

    test('Create User', async () => {
        const connection = ConnectionService.getConnection();
        const createUserTx = await createUserTransaction(walletAccount.publicKey);
        await sendAndConfirmTransaction(connection, createUserTx, [walletAccount]);
    });

    test('Stake Your Tokens', async () => {
        const connection = ConnectionService.getConnection();

        const amountToStake = 1000;
        const stakeYourTx = await stakeYourTransaction(
            walletAccount.publicKey,
            amountToStake
        );
        await sendAndConfirmTransaction(connection, stakeYourTx, [walletAccount]);
    })

    test('Claim Rewards', async () => {
        const connection = ConnectionService.getConnection();

        const claimRewardsTx = await claimRewardsTransaction(walletAccount.publicKey);
        await sendAndConfirmTransaction(connection, claimRewardsTx, [walletAccount]);
    });

    test('Unstake Your', async () => {
        const connection = ConnectionService.getConnection();

        const amountToUnstake = 1000;
        const unstakeYourTx = await unstakeYourTransaction(
            walletAccount.publicKey,
            amountToUnstake
        );
        await sendAndConfirmTransaction(connection, unstakeYourTx, [walletAccount]);
    });

    test('Close User', async () => {
        const connection = ConnectionService.getConnection();

        const closeUserTx = await closeUserTransaction(walletAccount.publicKey);
        await sendAndConfirmTransaction(connection, closeUserTx, [walletAccount]);
    });

    test('Close Pool', async () => {
        const connection = ConnectionService.getConnection();

        const closePoolTx = await closePoolTransaction(adminAccount.publicKey);
        await sendAndConfirmTransaction(connection, closePoolTx, [adminAccount]);
    });
});