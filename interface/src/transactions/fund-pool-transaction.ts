import {
    PublicKey,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { findAssociatedTokenAddress } from '../utils';
import { Constants, Pubkeys } from '../constants';
import { ConnectionService } from '../config';
import { CwarStakingInstructions } from '../models';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
export async function fundPoolTransaction(
    funderWallet: PublicKey,
    amount: number
): Promise<Transaction> {
    const connection = ConnectionService.getConnection();

    const rewardsATAPubkey = await findAssociatedTokenAddress(
        funderWallet,
        Pubkeys.rewardsMintPubkey
    );
    const amountToFund = new BN(amount).mul(new BN(Constants.toRewardTokenRaw));
    const fundPoolIx = new TransactionInstruction({
        programId: Pubkeys.cwarStakingProgramId,
        keys: [
            {
                pubkey: funderWallet,
                isSigner: true,
                isWritable: false,
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
                pubkey: Pubkeys.cwarRewardsVaultPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: rewardsATAPubkey,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
            CwarStakingInstructions.FundPool,  ...amountToFund.toArray('le', 8)
        ]),
    });
    const fundPoolTx = new Transaction().add(fundPoolIx);
    fundPoolTx.recentBlockhash = (
        await connection.getRecentBlockhash()
    ).blockhash;
    fundPoolTx.feePayer = funderWallet;

    return fundPoolTx;
}
