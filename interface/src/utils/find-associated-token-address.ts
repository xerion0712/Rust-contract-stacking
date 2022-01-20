import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {PublicKey} from '@solana/web3.js';
import {Pubkeys} from '../constants';

/**
 * Find token address on chain
 *
 * @param walletAddress
 * @param tokenMintAddress
 * @returns address of the token
 */
export async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        tokenMintAddress.toBuffer(),
      ],
      Pubkeys.splAssociatedTokenAccountProgramId
    )
  )[0];
}
