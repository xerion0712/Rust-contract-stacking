import {PublicKey} from '@solana/web3.js';

/**
 * Account Public Keys
 */
export class Pubkeys {
  static cwarStakingProgramId = new PublicKey(
    (process.env.SOLANA_PROGRAM_ID as string) ??
      (process.env.REACT_APP_SOLANA_PROGRAM_ID as string)
  );

  static splAssociatedTokenAccountProgramId = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
  );

  static cwarTokenMintPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static stakingMintPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static rewardsMintPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static cwarPoolStoragePubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static cwarStakingVaultPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );

  static cwarRewardsVaultPubkey = new PublicKey(
    'HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo'
  );
}
