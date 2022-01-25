import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { findAssociatedTokenAddress, getUserStorageAccount } from '../utils';
import { Constants, Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { YourStakingInstructions } from '../models';
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
export async function stakeYourTransaction(
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

    const amountToDepositRaw = new BN(amountToDeposit).mul(new BN(Constants.toYourRaw));

    const stakeYourIx = new TransactionInstruction({
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
                pubkey: stakingAssociatedAccPubkey,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
            YourStakingInstructions.StakeYour, ...amountToDepositRaw.toArray('le', 8)
        ]),
    });
    const stakeYourTx = new Transaction().add(stakeYourIx);
    stakeYourTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    stakeYourTx.feePayer = userWallet;

    return stakeYourTx;
}
