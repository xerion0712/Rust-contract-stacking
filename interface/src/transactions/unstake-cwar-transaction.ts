import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { findAssociatedTokenAddress, getPoolSignerPDA, getUserStorageAccount } from '../utils';
import { Constants, Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { CwarStakingInstructions } from '../models';
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
export async function unstakeCwarTransaction(
    userWallet: PublicKey,
    amountToWithdraw: number
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();

    const userStoragePubkey = await getUserStorageAccount(
        userWallet
    );

    const stakingATAPubkey = await findAssociatedTokenAddress(
        userWallet,
        Pubkeys.stakingMintPubkey
    );

    const amountToWithdrawRaw = new BN(amountToWithdraw).mul(new BN(Constants.toCwarRaw));

    const poolSignerPda = await getPoolSignerPDA();

    const unstakeCwarIx = new TransactionInstruction({
        programId: Pubkeys.cwarStakingProgramId,
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
                pubkey: Pubkeys.cwarPoolStoragePubkey,
                isSigner: false,
                isWritable: true,
            },

            {
                pubkey: Pubkeys.cwarStakingVaultPubkey,
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
            CwarStakingInstructions.UnstakeCwar, ...amountToWithdrawRaw.toArray('le', 8)
        ]),
    });
    const unstakeCwarTx = new Transaction().add(unstakeCwarIx);
    unstakeCwarTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    unstakeCwarTx.feePayer = userWallet;

    return unstakeCwarTx;
}
