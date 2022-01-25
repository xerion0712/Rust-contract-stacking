import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { findAssociatedTokenAddress, getPoolSignerPDA, getUserStorageAccount } from '../utils';
import { Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { YourStakingInstructions } from '../models';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
export async function closePoolTransaction(
    poolOwnerWallet: PublicKey
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();



    const rewardsRefundeeATAPubkey = await findAssociatedTokenAddress(
        poolOwnerWallet,
        Pubkeys.rewardsMintPubkey
    );

    const rewardsRefundeeATAInfo = await connection.getAccountInfo(
        rewardsRefundeeATAPubkey
    );

    const doesRewardsRefundeeATAExist =
        rewardsRefundeeATAInfo?.owner !== undefined;

    const closePoolIxs: TransactionInstruction[] = [];
    if (!doesRewardsRefundeeATAExist) {
        const createRewardsRefundeeATAIx =
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                Pubkeys.rewardsMintPubkey,
                rewardsRefundeeATAPubkey,
                poolOwnerWallet,
                poolOwnerWallet
            );
        closePoolIxs.push(createRewardsRefundeeATAIx);
    }

    const stakeRefundeeATAPubkey = await findAssociatedTokenAddress(
        poolOwnerWallet,
        Pubkeys.stakingMintPubkey
    );

    const stakeRefundeeATAInfo = await connection.getAccountInfo(
        stakeRefundeeATAPubkey
    );

    const doesStakeRefundeeATAExist =
        stakeRefundeeATAInfo?.owner !== undefined;

    if (!doesStakeRefundeeATAExist) {
        const createStakeRefundeeATAIx =
            Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                Pubkeys.stakingMintPubkey,
                stakeRefundeeATAPubkey,
                poolOwnerWallet,
                poolOwnerWallet
            );
        closePoolIxs.push(createStakeRefundeeATAIx);
    }

    const poolSignerPda = await getPoolSignerPDA();

    const closePoolIx = new TransactionInstruction({
        programId: Pubkeys.yourStakingProgramId,
        keys: [
            {
                pubkey: poolOwnerWallet,
                isSigner: true,
                isWritable: false,
            },

            {
                pubkey: Pubkeys.yourStakingVaultPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: stakeRefundeeATAPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: Pubkeys.yourRewardsVaultPubkey,
                isSigner: false,
                isWritable: true,
            },

            {
                pubkey: rewardsRefundeeATAPubkey,
                isSigner: false,
                isWritable: true,
            },

            {
                pubkey: Pubkeys.yourPoolStoragePubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: poolSignerPda,
                isSigner: false,
                isWritable: false,
            },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
            YourStakingInstructions.ClosePool
        ]),
    });
    closePoolIxs.push(closePoolIx);
    const closePoolTx = new Transaction().add(...closePoolIxs);
    closePoolTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    closePoolTx.feePayer = poolOwnerWallet;

    return closePoolTx;
}
