import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { deserializeUnchecked } from 'borsh';
import BN from 'bn.js';
import { StringPublicKey } from '../data/ids';
import { ConnectionService } from '../config';
import { extendBorsh } from '../data/borsch';
import { Constants } from '../constants';

export class UserData {
    accountType: number;
    userWallet: StringPublicKey;
    cwarPool: StringPublicKey;
    balanceStaked: BN;
    nonce: number;
    rewardPerTokenPending: BN;
    rewardsPerTokenCompleted: BN;

    constructor(args: {
        accountType: number;
        userWallet: StringPublicKey;
        cwarPool: StringPublicKey;
        balanceStaked: BN;
        nonce: number;
        rewardPerTokenPending: BN;
        rewardsPerTokenCompleted: BN;
    }) {
        this.accountType = args.accountType;
        this.userWallet = args.userWallet;
        this.cwarPool = args.cwarPool;
        this.balanceStaked = args.balanceStaked;
        this.nonce = args.nonce;
        this.rewardPerTokenPending = args.rewardPerTokenPending;
        this.rewardsPerTokenCompleted = args.rewardsPerTokenCompleted;
    }

    getUserWalletPubkey(): PublicKey {
        return new PublicKey(this.userWallet);
    }

    getPoolPubkey(): PublicKey {
        return new PublicKey(this.cwarPool);
    }

    getBalanceStaked(): number {
        return this.balanceStaked.div(new BN(Constants.toYourRaw)).toNumber();
    }

    getNonce(): number {
        return this.nonce;
    }

    getRewardPerTokenPending(): number {
        return this.rewardPerTokenPending.div(new BN(Constants.toRewardTokenRaw)).toNumber();
    }

    getRewardPerTokenCompleted(): number {
        return this.rewardsPerTokenCompleted.div(new BN(Constants.toRewardTokenRaw).mul(new BN('18446744073709551615'))).toNumber();
    }

    

    static async fromAccount(account: PublicKey): Promise<UserData | null> {
        const connection = ConnectionService.getConnection();
        const accountData = await connection.getAccountInfo(account);
        if (!accountData) return null;
        return UserData.fromBuffer(accountData?.data);
    }

    static fromBuffer(buffer: Buffer): UserData {
        extendBorsh();
        return deserializeUnchecked(
            USER_STORAGE_DATA_ON_CHAIN_SCHEMA,
            UserData,
            buffer.slice(0, USER_STORAGE_TOTAL_BYTES)
        );
    }
}

export const USER_STORAGE_TOTAL_BYTES = 98;

export const USER_STORAGE_DATA_ON_CHAIN_SCHEMA = new Map<any, any>([
    [
        UserData,
        {
            kind: 'struct',
            fields: [
                ['accountType', 'u8'],
                ['userWallet', 'pubkeyAsString'],
                ['cwarPool', 'pubkeyAsString'],
                ['balanceStaked', 'u64'],
                ['nonce', 'u8'],
                ['rewardPerTokenPending', 'u64'],
                ['rewardsPerTokenCompleted', 'u128'],
            ],
        },
    ],
]);
