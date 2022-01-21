import {ConnectionService} from "../src/config";
import {createInitializePoolTransaction, createUserTransaction} from "../src/transactions";
import {setupTest} from './testHelpers';
import {
    adminAccount,
    rewardDurationInDays, setupEnvironment,
    walletAccount,
    yourPoolStorageAccount,
    yourRewardsVault,
    yourStakingVault,
} from "./prepereTestsEvironment";
import {sendAndConfirmTransaction} from "@solana/web3.js";

setupTest();

describe('Your Token Staking Tests', () => {
    beforeEach(async () => {
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
});