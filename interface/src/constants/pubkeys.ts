import {PublicKey} from '@solana/web3.js';

/**
 * Account Public Keys
 */
export class Pubkeys {
  static yourStakingProgramId = new PublicKey(
    (process.env.SOLANA_PROGRAM_ID as string) ??
      (process.env.REACT_APP_SOLANA_PROGRAM_ID as string)
  );

  static splAssociatedTokenAccountProgramId = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
  );

  static yourTokenMintPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static stakingMintPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static rewardsMintPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static yourPoolStoragePubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static yourStakingVaultPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static yourRewardsVaultPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );
}
