import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { findAssociatedTokenAddress, getPoolSignerPDA, getUserStorageAccount } from '../utils';
import { Constants, Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { YourStakingInstructions } from '../models';
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
export async function finalUnstakeYourTransaction(
    userWallet: PublicKey,
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();

    const userStoragePubkey = await getUserStorageAccount(
        userWallet
    );

    const stakingATAPubkey = await findAssociatedTokenAddress(
        userWallet,
        Pubkeys.stakingMintPubkey
    );

    const poolSignerPda = await getPoolSignerPDA();

    const unstakeYourIx = new TransactionInstruction({
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
                pubkey: stakingATAPubkey,
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
            YourStakingInstructions.FinalUnstake
        ]),
    });
    const finalUnstakeYourTx = new Transaction().add(unstakeYourIx);
    finalUnstakeYourTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    finalUnstakeYourTx.feePayer = userWallet;

    return finalUnstakeYourTx;
}
