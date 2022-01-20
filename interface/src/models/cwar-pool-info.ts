import {Buffer} from 'buffer';
import {PublicKey} from '@solana/web3.js';
import {deserializeUnchecked} from 'borsh';
import BN from 'bn.js';
import { StringPublicKey } from '../data/ids';
import { ConnectionService } from '../config';
import { extendBorsh } from '../data/borsch';
import { Constants } from '../constants';

export class CwarPoolData {
  accountType: number;
    ownerWallet: StringPublicKey;
    stakingVault: StringPublicKey;
    stakingMint: StringPublicKey;
    rewardVault: StringPublicKey;
    rewardMint: StringPublicKey;
    rewardRate: BN;
    rewardDuration: BN;
    totalStakeLastUpdateTime: BN;
    rewardPerTokenStored: BN;
    userStakeCount: BN;
    pdaNonce: number;
    funders: FundersData;
    rewardDurationEnd: BN;

  constructor(args: {
    accountType: number;
    ownerWallet: StringPublicKey;
    stakingVault: StringPublicKey;
    stakingMint: StringPublicKey;
    rewardVault: StringPublicKey;
    rewardMint: StringPublicKey;
    rewardRate: BN;
    rewardDuration: BN;
    totalStakeLastUpdateTime: BN;
    rewardPerTokenStored: BN;
    userStakeCount: BN;
    pdaNonce: number;
    funders: FundersData;
    rewardDurationEnd: BN;
  }) {
    this.accountType = args.accountType;
    this.ownerWallet = args.ownerWallet;
    this.stakingVault = args.stakingVault;
    this.stakingMint = args.stakingMint;
    this.rewardVault = args.rewardVault;
    this.rewardMint = args.rewardMint;
    this.rewardRate = args.rewardRate;
    this.rewardDuration = args.rewardDuration;
    this.totalStakeLastUpdateTime = args.totalStakeLastUpdateTime;
    this.rewardPerTokenStored = args.rewardPerTokenStored;
    this.userStakeCount = args.userStakeCount;
    this.pdaNonce = args.pdaNonce;
    this.funders = args.funders;
    this.rewardDurationEnd = args.rewardDurationEnd;
  }

  getAuthorityPubkey(): PublicKey {
    return new PublicKey(this.ownerWallet);
  }

  getStakingVaultPubkey(): PublicKey {
    return new PublicKey(this.stakingVault);
  }

  getStakingMintPubkey(): PublicKey {
    return new PublicKey(this.stakingMint);
  }

  getRewardVaultPubkey(): PublicKey {
    return new PublicKey(this.rewardVault);
  }

  getRewardMintPubkey(): PublicKey {
    return new PublicKey(this.rewardMint);
  }

  getRewardRate(): number {
    return this.rewardRate.div(new BN(Constants.toCwarRaw)).toNumber();
  }

  getRewardDuration(): number {
    return this.rewardDuration.toNumber();
  }

  getRewardDurationInDays(): number {
    return this.rewardDuration.toNumber()/86400;
  }

  getTotalStakeLastUpdateTime(): number {
    return this.totalStakeLastUpdateTime.toNumber();
  }

  getRewardPerTokenStored(): number {
    return this.rewardPerTokenStored.div(new BN('18446744073709551615').mul(new BN(Constants.toRewardTokenRaw))).toNumber();
  }

  getUserStakeCount(): number {
    return this.userStakeCount.toNumber();
  }

  getPdaNonce(): number {
    return this.pdaNonce;
  }

  getFundersArray(): FundersData {
    return this.funders;
  }

  getRewardDurationEnd(): number {
    return this.rewardDurationEnd.toNumber();
  }

  static async fromAccount(account: PublicKey): Promise<CwarPoolData | null> {
    const connection = ConnectionService.getConnection();
    const accountData = await connection.getAccountInfo(account);
    if (!accountData) return null;
    return CwarPoolData.fromBuffer(accountData?.data);
  }

  static fromBuffer(buffer: Buffer): CwarPoolData {
    extendBorsh();
    return deserializeUnchecked(
      CWAR_POOL_DATA_ON_CHAIN_SCHEMA,
      CwarPoolData,
      buffer.slice(0, CWAR_POOL_STORAGE_TOTAL_BYTES)
    );
  }
}
export class FundersData {
    funder1: StringPublicKey;
    funder2: StringPublicKey;
    funder3: StringPublicKey;
    funder4: StringPublicKey;
    funder5: StringPublicKey;
    constructor(args: {
        funder1: StringPublicKey;
        funder2: StringPublicKey;
        funder3: StringPublicKey;
        funder4: StringPublicKey;
        funder5: StringPublicKey;
    }) {
      this.funder1 = args.funder1;
      this.funder2 = args.funder2;
      this.funder3 = args.funder3;
      this.funder4 = args.funder4;
      this.funder5 = args.funder5;
    }
  }
export const CWAR_POOL_STORAGE_TOTAL_BYTES = 374;

export const CWAR_POOL_DATA_ON_CHAIN_SCHEMA = new Map<any, any>([
    [
        FundersData, {
            kind: 'struct',
            fields: [
                ['funder1', 'pubkeyAsString'],
                ['funder2', 'pubkeyAsString'],
                ['funder3', 'pubkeyAsString'],
                ['funder4', 'pubkeyAsString'],
                ['funder5', 'pubkeyAsString'],
            ]
        }
    ],
  [
    CwarPoolData,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['ownerWallet', 'pubkeyAsString'],
        ['stakingVault', 'pubkeyAsString'],
        ['stakingMint', 'pubkeyAsString'],
        ['rewardVault', 'pubkeyAsString'],
        ['rewardMint', 'pubkeyAsString'],
        ['rewardRate', 'u64'],
        ['rewardDuration', 'u64'],
        ['totalStakeLastUpdateTime', 'u64'],
        ['rewardsPerTokenStored', 'u128'],
        ['userStakeCount', 'u32'],
        ['pdaNonce', 'u8'],
        ['funders', FundersData],
        ['rewardDurationEnd', 'u64'],
      ],
    },
  ],
]);
