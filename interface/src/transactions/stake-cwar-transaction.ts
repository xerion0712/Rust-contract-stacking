import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { findAssociatedTokenAddress, getUserStorageAccount } from '../utils';
import { Constants, Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { CwarStakingInstructions } from '../models';
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
export async function stakeCwarTransaction(
    userWallet: PublicKey,
    amountToDeposit: number
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();

    const userStoragePubkey = await getUserStorageAccount(
        userWallet
    );

    const stakingAssociatedAccPubkey = await findAssociatedTokenAddress(
        userWallet,
        Pubkeys.stakingMintPubkey
    );

    const amountToDepositRaw = new BN(amountToDeposit).mul(new BN(Constants.toCwarRaw));

    const stakeCwarIx = new TransactionInstruction({
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
                pubkey: stakingAssociatedAccPubkey,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
            CwarStakingInstructions.StakeCwar, ...amountToDepositRaw.toArray('le', 8)
        ]),
    });
    const stakeCwarTx = new Transaction().add(stakeCwarIx);
    stakeCwarTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    stakeCwarTx.feePayer = userWallet;

    return stakeCwarTx;
}
