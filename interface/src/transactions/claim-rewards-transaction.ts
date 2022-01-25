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
export async function claimRewardsTransaction(
    userWallet: PublicKey
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();

    const userStoragePubkey = await getUserStorageAccount(
        userWallet
    );

    const rewardsATAPubkey = await findAssociatedTokenAddress(
        userWallet,
        Pubkeys.rewardsMintPubkey
    );

    const rewardsAtaInfo = await connection.getAccountInfo(
        rewardsATAPubkey
      );
    
      const doesRewardsAtaExist =
        rewardsAtaInfo?.owner !== undefined;
    
      const claimRewardsIxs: TransactionInstruction[] = [];
      if (!doesRewardsAtaExist) {
        const createFantAssociatedAccountIx =
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            Pubkeys.rewardsMintPubkey,
            rewardsATAPubkey,
            userWallet,
            userWallet
          );
          claimRewardsIxs.push(createFantAssociatedAccountIx);
      }

    const poolSignerPda = await getPoolSignerPDA();

    const claimRewardsIx = new TransactionInstruction({
        programId: Pubkeys.yourStakingProgramId,
        keys: [
            {
                pubkey: userWallet,
                isSigner: true,
                isWritable: false,
            },

            {
                pubkey: userStoragePubkey,
                isSigner: false,
                isWritable: true,
            },

            {
                pubkey: Pubkeys.yourPoolStoragePubkey,
                isSigner: false,
                isWritable: true,
            },

            {
                pubkey: Pubkeys.yourStakingVaultPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: Pubkeys.yourRewardsVaultPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: rewardsATAPubkey,
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
            YourStakingInstructions.ClaimRewards
        ]),
    });
    claimRewardsIxs.push(claimRewardsIx);
    const claimRewardsTx = new Transaction().add(...claimRewardsIxs);
    claimRewardsTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    claimRewardsTx.feePayer = userWallet;

    return claimRewardsTx;
}
