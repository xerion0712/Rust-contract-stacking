use crate::{
    error::CustomError,
    state::{AccTypesWithVersion, YourPool, YOUR_POOL_STORAGE_TOTAL_BYTES},
    utils::constants,
};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use spl_token::state::Account as TokenAccount;

pub fn process_initialize_cwar_pool(
    accounts: &[AccountInfo],
    reward_duration: u64,
    pool_nonce: u8,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let pool_owner_wallet_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let your_staking_mint = next_account_info(account_info_iter)?;
    let your_staking_vault = next_account_info(account_info_iter)?;
    let your_rewards_mint = next_account_info(account_info_iter)?;
    let your_rewards_vault = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    msg!("pool_nonce: {}", pool_nonce);
    msg!(
        "Pool Authority: {}",
        pool_owner_wallet_account.key.to_string()
    );
    msg!(
        "Pool Storage: {}",
        your_pool_storage_account.key.to_string()
    );
    msg!("Staking Mint: {}", your_staking_mint.key.to_string());
    msg!("Staking Vault: {}", your_staking_vault.key.to_string());
    msg!("Rewards Mint: {}", your_rewards_mint.key.to_string());
    msg!("Rewards Vault: {}", your_rewards_vault.key.to_string());
    if !pool_owner_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    let rent = Rent::get()?;

    if !rent.is_exempt(your_staking_vault.lamports(), your_staking_vault.data_len()) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if !rent.is_exempt(your_rewards_vault.lamports(), your_rewards_vault.data_len()) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if !rent.is_exempt(
        your_pool_storage_account.lamports(),
        your_pool_storage_account.data_len(),
    ) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if your_pool_storage_account.data_len() != YOUR_POOL_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }

    let (pool_signer_address, bump_seed) =
        Pubkey::find_program_address(&[&your_pool_storage_account.key.to_bytes()], program_id);
    msg!("Calling the token program to transfer Staking vault account ownership to Pool program...");
    invoke(
        &spl_token::instruction::set_authority(
            token_program.key,
            your_staking_vault.key,
            Some(&pool_signer_address),
            spl_token::instruction::AuthorityType::AccountOwner,
            pool_owner_wallet_account.key,
            &[&pool_owner_wallet_account.key],
        )?,
        &[
            your_staking_vault.clone(),
            pool_owner_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("Calling the token program to transfer Rewards vault account ownership to Pool program...");
    invoke(
        &spl_token::instruction::set_authority(
            token_program.key,
            your_rewards_vault.key,
            Some(&pool_signer_address),
            spl_token::instruction::AuthorityType::AccountOwner,
            pool_owner_wallet_account.key,
            &[&pool_owner_wallet_account.key],
        )?,
        &[
            your_rewards_vault.clone(),
            pool_owner_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    if reward_duration < constants::MIN_DURATION {
        msg!("CustomError::DurationTooShort");
        return Err(CustomError::DurationTooShort.into());
    }

    let your_staking_vault_data = TokenAccount::unpack(&your_staking_vault.data.borrow())?;
    if your_staking_vault_data.mint != *your_staking_mint.key {
        msg!("CustomError::MintMismatched");
        return Err(CustomError::MintMismatched.into());
    }

    let your_rewards_vault_data = TokenAccount::unpack(&your_rewards_vault.data.borrow())?;
    if your_rewards_vault_data.mint != *your_rewards_mint.key {
        msg!("CustomError::MintMismatched");
        return Err(CustomError::MintMismatched.into());
    }

    let mut your_pool_data_byte_array = your_pool_storage_account.data.try_borrow_mut().unwrap();
    let mut your_pool_data: YourPool =
        YourPool::try_from_slice(&your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES])
            .unwrap();

    if your_pool_data.acc_type != 0 {
        msg!("CustomError::PoolAddressAlreadyInitialized");
        return Err(CustomError::PoolAddressAlreadyInitialized.into());
    }
    your_pool_data.acc_type = AccTypesWithVersion::YourPoolDataV1 as u8;
    your_pool_data.owner_wallet = *pool_owner_wallet_account.key;
    your_pool_data.your_staking_vault = *your_staking_vault.key;
    your_pool_data.your_staking_mint = *your_staking_mint.key;
    your_pool_data.your_reward_vault = *your_rewards_vault.key;
    your_pool_data.your_reward_mint = *your_rewards_mint.key;
    your_pool_data.your_reward_rate = 0u64;
    your_pool_data.your_reward_duration = reward_duration;
    your_pool_data.total_stake_last_update_time = 0u64;
    your_pool_data.your_reward_per_token_stored = 0u128;
    your_pool_data.user_stake_count = 0u32;
    your_pool_data.pda_nonce = bump_seed;
    your_pool_data.reward_duration_end = 0u64;

    your_pool_data.user_stake_count += 1u32;

    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());

    Ok(())
}
