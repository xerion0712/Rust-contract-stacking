import {getAdminAccount, requestAirdrop} from "./testHelpers";
import {Keypair, sendAndConfirmTransaction, Transaction} from "@solana/web3.js";
import {Constants, Pubkeys} from "../src/constants";
import {ConnectionService} from "../src/config";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {findAssociatedTokenAddress} from "../src/utils";
import BN from "bn.js";
import {createInitializePoolTransaction} from "../src/transactions";


const adminAccount: Keypair = getAdminAccount();
const walletAccount: Keypair = Keypair.generate();
const yourPoolStorageAccount: Keypair = Keypair.generate();
const yourStakingVault: Keypair = Keypair.generate();
const yourRewardsVault: Keypair = Keypair.generate();
const rewardDurationInDays: number = 1;
const yourDecimals = 9;
const rewardTokenDecimals = 9;

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
    Pubkeys.yourPoolStoragePubkey = yourPoolStorageAccount.publicKey;
    Pubkeys.yourStakingVaultPubkey = yourStakingVault.publicKey;
    Pubkeys.yourRewardsVaultPubkey = yourRewardsVault.publicKey;

    const funderRewardTokenData = await findAssociatedTokenAddress(
        adminAccount.publicKey,
        Pubkeys.rewardsMintPubkey
    );
    const funderRewardDataInfo = await connection.getAccountInfo(
        funderRewardTokenData
    );
    const doesRewardsDataExist = funderRewardDataInfo?.owner !== undefined;

    if (!doesRewardsDataExist) {
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




    await requestAirdrop(walletAccount.publicKey);
    const userYourTokenData = await findAssociatedTokenAddress(
        walletAccount.publicKey,
        Pubkeys.yourTokenMintPubkey
    );
    const userYourDataInfo = await connection.getAccountInfo(userYourTokenData);
    const doesUserYourDataExist = userYourDataInfo?.owner !== undefined;

    if (!doesUserYourDataExist) {
        const createUserYourDataIx = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            Pubkeys.yourTokenMintPubkey,
            userYourTokenData,
            walletAccount.publicKey,
            walletAccount.publicKey
        );
        const createUserYourDataTx = new Transaction().add(createUserYourDataIx);
        await sendAndConfirmTransaction(connection, createUserYourDataTx, [
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
    yourPoolStorageAccount,
    yourStakingVault,
    yourRewardsVault,
    rewardDurationInDays,
    setupEnvironment
}