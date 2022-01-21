import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { getUserStorageAccount } from '../utils';
import { Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { CwarStakingInstructions } from '../models';
export async function closeUserTransaction(
    userWallet: PublicKey
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();

    const userStoragePubkey = await getUserStorageAccount(
        userWallet
    );

    const closeUserIx = new TransactionInstruction({
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
        ],
        data: Buffer.from([
            CwarStakingInstructions.CloseUser
        ]),
    });
    const closeUserTx = new Transaction().add(closeUserIx);
    closeUserTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    closeUserTx.feePayer = userWallet;

    return closeUserTx;
}
