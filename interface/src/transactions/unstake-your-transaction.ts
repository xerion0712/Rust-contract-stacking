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
export async function unstakeYourTransaction(
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

    const amountToWithdrawRaw = new BN(amountToWithdraw).mul(new BN(Constants.toYourRaw));

    const poolSignerPda = await getPoolSignerPDA();

    const unstakeCwarIx = new TransactionInstruction({
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
            YourStakingInstructions.UnstakeYour, ...amountToWithdrawRaw.toArray('le', 8)
        ]),
    });
    const unstakeCwarTx = new Transaction().add(unstakeCwarIx);
    unstakeCwarTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    unstakeCwarTx.feePayer = userWallet;

    return unstakeCwarTx;
}
