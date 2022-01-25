import { PublicKey } from '@solana/web3.js';
import { Pubkeys } from '../constants';

export async function getPoolSignerPDA(

): Promise<PublicKey> {
    return (
        await PublicKey.findProgramAddress(
            [
                Pubkeys.yourPoolStoragePubkey.toBuffer(),
            ],
            Pubkeys.yourStakingProgramId
        )
    )[0];
}


export async function getPoolSignerPdaWithNonce(

): Promise<[PublicKey, Number]> {
    return (
        await PublicKey.findProgramAddress(
            [
                Pubkeys.yourPoolStoragePubkey.toBuffer(),
            ],
            Pubkeys.yourStakingProgramId
        )
    );
}

export async function getPoolSignerPdaNonce(

    ): Promise<Number> {
        return (
            await PublicKey.findProgramAddress(
                [
                    Pubkeys.yourPoolStoragePubkey.toBuffer(),
                ],
                Pubkeys.yourStakingProgramId
            )
        )[1];
    }