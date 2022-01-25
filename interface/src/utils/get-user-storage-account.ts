import {PublicKey} from '@solana/web3.js';
import {Pubkeys} from '../constants';

export async function getUserStorageAccount(
  userWallet: PublicKey
): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [userWallet.toBuffer(), Pubkeys.yourPoolStoragePubkey.toBuffer()],
      Pubkeys.yourStakingProgramId
    )
  )[0];
}


export async function getUserStorageAccountWithNonce(
    userWallet: PublicKey
  ): Promise<[PublicKey, Number]> {
    return (
      await PublicKey.findProgramAddress(
        [userWallet.toBuffer(), Pubkeys.yourPoolStoragePubkey.toBuffer()],
        Pubkeys.yourStakingProgramId
      )
    );
  }