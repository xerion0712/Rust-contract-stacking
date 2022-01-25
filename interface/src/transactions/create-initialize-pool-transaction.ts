import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { ConnectionService } from '../config';
import { Pubkeys } from '../constants';
import { YourStakingInstructions } from '../models';
import {findAssociatedTokenAddress, getPoolSignerPdaNonce} from '../utils';

export async function createInitializePoolTransaction(
    poolOwnerWallet: PublicKey,
    yourPoolStorageAccount: Keypair,
    yourStakingVault: Keypair,
    yourRewardsVault: Keypair,
    rewardDurationInDays: number,
    fundPoolAmount: number
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();
    const poolStorageBytes = 94;
    const rewardDuration = rewardDurationInDays * 86400;
    console.log('Pool Storage Pubkey: ', yourPoolStorageAccount.publicKey.toString());
    console.log('Staking Vault Pubkey: ', yourStakingVault.publicKey.toString());
    console.log('Rewards Vault Pubkey: ', yourRewardsVault.publicKey.toString());
    const newAccountKeypair = Keypair.generate();
    const createStakingVaultIx = SystemProgram.createAccount({
        space: AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(
            AccountLayout.span,
            'confirmed'
        ),
        fromPubkey: poolOwnerWallet,
        newAccountPubkey: yourStakingVault.publicKey,
        programId: TOKEN_PROGRAM_ID,
    });

    const initStakingVaultIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        Pubkeys.stakingMintPubkey,
        yourStakingVault.publicKey,
        poolOwnerWallet
    );
    const createRewardsVaultIx = SystemProgram.createAccount({
        space: AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(
            AccountLayout.span,
            'confirmed'
        ),
        fromPubkey: poolOwnerWallet,
        newAccountPubkey: yourRewardsVault.publicKey,
        programId: TOKEN_PROGRAM_ID,
    });

    const initRewardsVaultIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        Pubkeys.rewardsMintPubkey,
        yourRewardsVault.publicKey,
        poolOwnerWallet
    );
    const pool_nonce = await getPoolSignerPdaNonce();
    const rentPrice = await connection.getMinimumBalanceForRentExemption(
        poolStorageBytes,
        'confirmed'
    );
    const createPoolStorageAccountIx = SystemProgram.createAccount({
        space: poolStorageBytes,
        lamports: rentPrice,
        fromPubkey: poolOwnerWallet,
        newAccountPubkey: yourPoolStorageAccount.publicKey,
        programId: Pubkeys.yourStakingProgramId,
    });

    const balance = await connection.getBalance(poolOwnerWallet);
    if (balance < rentPrice)
        throw new Error(
            `Need at least ${rentPrice / LAMPORTS_PER_SOL
            } SOL for contest account rent`
        );

    const funderWallet = poolOwnerWallet; // admin account
    const rewardsATAPubkey = await findAssociatedTokenAddress(
        funderWallet,
        Pubkeys.rewardsMintPubkey
    );

    const initPoolStorageAccountIx = new TransactionInstruction({
        programId: Pubkeys.yourStakingProgramId,
        keys: [
            {
                pubkey: poolOwnerWallet,
                isSigner: true,
                isWritable: false,
            },
            {
                pubkey: yourPoolStorageAccount.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: Pubkeys.stakingMintPubkey,
                isSigner: false,
                isWritable: false,
            },
            {
                pubkey: yourStakingVault.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: Pubkeys.rewardsMintPubkey,
                isSigner: false,
                isWritable: false,
            },
            {
                pubkey: yourRewardsVault.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: funderWallet,
                isSigner: true,
                isWritable: false,
            },
            {
                pubkey: rewardsATAPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            }
        ],
        data: Buffer.from([
            YourStakingInstructions.InitializeYourPool,
            ...new BN(rewardDuration).toArray('le', 8), ...new BN(pool_nonce.valueOf()).toArray('le', 1), ... new BN
            (fundPoolAmount).toArray('le', 8)
        ])
    });

    const transaction = new Transaction().add(
        createStakingVaultIx,
        initStakingVaultIx,
        createRewardsVaultIx,
        initRewardsVaultIx,
        createPoolStorageAccountIx,
        initPoolStorageAccountIx
    );

    transaction.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    transaction.feePayer = poolOwnerWallet;

    transaction.partialSign(yourStakingVault, yourRewardsVault, yourPoolStorageAccount);

    return transaction;
}
