import {getAdminAccount, requestAirdrop} from "./testHelpers";
import {Keypair, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";
import {Constants, Pubkeys} from "../src/constants";
import {ConnectionService} from "../src/config";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {findAssociatedTokenAddress} from "../src/utils";
import BN from "bn.js";
import {
    createInitializePoolTransaction, createUserTransaction
} from "../src/transactions";

const adminAccount: Keypair = getAdminAccount();
const walletAccount: Keypair = Keypair.generate();
let yourPoolStorageAccount: Keypair;
let yourStakingVault: Keypair;
let yourRewardsVault: Keypair;
const rewardDurationInDays: number = 1 / 86400;
const yourDecimals = 9;
const rewardTokenDecimals = 9;

/** wallets for claim rewards **/
const wallet1Account: Keypair = Keypair.generate();
const wallet2Account: Keypair = Keypair.generate();

async function setupEnvironment() {
    Constants.yourDecimals = yourDecimals;
    Constants.rewardTokenDecimals = rewardTokenDecimals;

    const connection = ConnectionService.getConnection();

    const yourTokenMint = await Token.createMint(
        connection,
        adminAccount,
        adminAccount.publicKey,
        null,
        yourDecimals,
        TOKEN_PROGRAM_ID
    );
    Pubkeys.stakingMintPubkey = yourTokenMint.publicKey;
    Pubkeys.yourTokenMintPubkey = yourTokenMint.publicKey;

    const rewardTokenMint = await Token.createMint(
        connection,
        adminAccount,
        adminAccount.publicKey,
        null,
        rewardTokenDecimals,
        TOKEN_PROGRAM_ID
    );
    Pubkeys.rewardsMintPubkey = rewardTokenMint.publicKey;

    yourPoolStorageAccount = Keypair.generate();
    yourStakingVault = Keypair.generate();
    yourRewardsVault = Keypair.generate();

    const funderRewardTokenData = await findAssociatedTokenAddress(
        adminAccount.publicKey,
        Pubkeys.rewardsMintPubkey
    );
    const funderRewardAtaInfo = await connection.getAccountInfo(
        funderRewardTokenData
    );
    const doesRewardsAtaExist = funderRewardAtaInfo?.owner !== undefined;

    if (!doesRewardsAtaExist) {
        const createFunderRewardsAtaIx =
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                Pubkeys.rewardsMintPubkey,
                funderRewardTokenData,
                adminAccount.publicKey,
                adminAccount.publicKey
            );
        const createFunderRewardsAtaTx = new Transaction().add(
            createFunderRewardsAtaIx
        );
        await sendAndConfirmTransaction(connection, createFunderRewardsAtaTx, [
            adminAccount,
        ]);
    }

    const rewardsTokenToMint: number = 10000;
    const rewardTokensToMintRaw = new BN(rewardsTokenToMint)
        .mul(new BN(Constants.toYourRaw))
        .toArray('le', 8);
    await rewardTokenMint.mintTo(
        funderRewardTokenData,
        adminAccount.publicKey,
        [],
        new u64(rewardTokensToMintRaw)
    );

    await requestAirdrop(adminAccount.publicKey);
    Pubkeys.yourPoolStoragePubkey = yourPoolStorageAccount.publicKey;
    Pubkeys.yourStakingVaultPubkey = yourStakingVault.publicKey;
    Pubkeys.yourRewardsVaultPubkey = yourRewardsVault.publicKey;

    await requestAirdrop(walletAccount.publicKey);

    const userYourTokenData = await findAssociatedTokenAddress(
        walletAccount.publicKey,
        Pubkeys.yourTokenMintPubkey
    );

    const userYourDataInfo = await connection.getAccountInfo(userYourTokenData);
    const doesUserYourDataExist = userYourDataInfo?.owner !== undefined;
    if (!doesUserYourDataExist) {
        const createUserCwarAtaIx = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            Pubkeys.yourTokenMintPubkey,
            userYourTokenData,
            walletAccount.publicKey,
            walletAccount.publicKey
        );
        const createUserCwarAtaTx = new Transaction().add(createUserCwarAtaIx);
        await sendAndConfirmTransaction(connection, createUserCwarAtaTx, [
            walletAccount,
        ]);
    }
    const yourTokensToMint: number = 1000;
    const yourTokensToMintRaw = new BN(yourTokensToMint)
        .mul(new BN(Constants.toYourRaw))
        .toArray('le', 8);
    await yourTokenMint.mintTo(
        userYourTokenData,
        adminAccount.publicKey,
        [],
        new u64(yourTokensToMintRaw)
    );
}

export {
    adminAccount,
    walletAccount,
    setupEnvironment,
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    rewardDurationInDays
}