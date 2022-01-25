use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

pub enum AccTypesWithVersion {
    YourPoolDataV1 = 2,
    UserDataV1 = 3,
}

pub const YOUR_POOL_STORAGE_TOTAL_BYTES: usize = 94; // Should be 2 bytes less than real size of
#[derive(Clone, BorshDeserialize, BorshSerialize, Copy)]
pub struct YourPool {
    pub acc_type: u8,
    pub owner_wallet: Pubkey,
    pub your_staking_vault: Pubkey,
    pub your_reward_rate: u64,
    pub your_epoch_duration: u64,
    pub user_stake_count: u32,
    pub pda_nonce: u8,
    pub reward_duration_end: u64,
}

pub const USER_STORAGE_TOTAL_BYTES: usize = 98;
#[derive(Clone, BorshDeserialize, BorshSerialize, Copy)]
pub struct User {
    pub acc_type: u8,
    pub user_wallet: Pubkey,
    pub your_pool: Pubkey,
    pub balance_your_staked: u64,
    pub nonce: u8,
    pub your_reward_per_token_pending: u64,
    pub your_reward_per_token_completed: u128,
}
