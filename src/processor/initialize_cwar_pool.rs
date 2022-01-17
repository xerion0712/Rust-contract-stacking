use crate::{
    error::CustomError,
    state::{AccTypesWithVersion, CwarPool, CWAR_POOL_STORAGE_TOTAL_BYTES},
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
    let cwar_pool_storage_account = next_account_info(account_info_iter)?;
    let cwar_staking_mint = next_account_info(account_info_iter)?;
    let cwar_staking_vault = next_account_info(account_info_iter)?;
    let cwar_rewards_mint = next_account_info(account_info_iter)?;
    let cwar_rewards_vault = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    msg!("pool_nonce: {}", pool_nonce);
    msg!(
        "Pool Authority: {}",
        pool_owner_wallet_account.key.to_string()
    );
    msg!(
        "Pool Storage: {}",
        cwar_pool_storage_account.key.to_string()
    );
    msg!("Staking Mint: {}", cwar_staking_mint.key.to_string());
    msg!("Staking Vault: {}", cwar_staking_vault.key.to_string());
    msg!("Rewards Mint: {}", cwar_rewards_mint.key.to_string());
    msg!("Rewards Vault: {}", cwar_rewards_vault.key.to_string());
    if !pool_owner_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    let rent = Rent::get()?;

    if !rent.is_exempt(cwar_staking_vault.lamports(), cwar_staking_vault.data_len()) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if !rent.is_exempt(cwar_rewards_vault.lamports(), cwar_rewards_vault.data_len()) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if !rent.is_exempt(
        cwar_pool_storage_account.lamports(),
        cwar_pool_storage_account.data_len(),
    ) {
        msg!("CustomError::NotRentExempt");
        return Err(CustomError::NotRentExempt.into());
    }

    if cwar_pool_storage_account.data_len() != CWAR_POOL_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }

    let (pool_signer_address, bump_seed) =
        Pubkey::find_program_address(&[&cwar_pool_storage_account.key.to_bytes()], program_id);
    msg!("Calling the token program to transfer Staking vault account ownership to Pool program...");
    invoke(
        &spl_token::instruction::set_authority(
            token_program.key,
            cwar_staking_vault.key,
            Some(&pool_signer_address),
            spl_token::instruction::AuthorityType::AccountOwner,
            pool_owner_wallet_account.key,
            &[&pool_owner_wallet_account.key],
        )?,
        &[
            cwar_staking_vault.clone(),
            pool_owner_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    msg!("Calling the token program to transfer Rewards vault account ownership to Pool program...");
    invoke(
        &spl_token::instruction::set_authority(
            token_program.key,
            cwar_rewards_vault.key,
            Some(&pool_signer_address),
            spl_token::instruction::AuthorityType::AccountOwner,
            pool_owner_wallet_account.key,
            &[&pool_owner_wallet_account.key],
        )?,
        &[
            cwar_rewards_vault.clone(),
            pool_owner_wallet_account.clone(),
            token_program.clone(),
        ],
    )?;

    if reward_duration < constants::MIN_DURATION {
        msg!("CustomError::DurationTooShort");
        return Err(CustomError::DurationTooShort.into());
    }

    let cwar_staking_vault_data = TokenAccount::unpack(&cwar_staking_vault.data.borrow())?;
    if cwar_staking_vault_data.mint != *cwar_staking_mint.key {
        msg!("CustomError::MintMismatched");
        return Err(CustomError::MintMismatched.into());
    }

    let cwar_rewards_vault_data = TokenAccount::unpack(&cwar_rewards_vault.data.borrow())?;
    if cwar_rewards_vault_data.mint != *cwar_rewards_mint.key {
        msg!("CustomError::MintMismatched");
        return Err(CustomError::MintMismatched.into());
    }

    let mut cwar_pool_data_byte_array = cwar_pool_storage_account.data.try_borrow_mut().unwrap();
    let mut cwar_pool_data: CwarPool =
        CwarPool::try_from_slice(&cwar_pool_data_byte_array[0usize..CWAR_POOL_STORAGE_TOTAL_BYTES])
            .unwrap();

    if cwar_pool_data.acc_type != 0 {
        msg!("CustomError::PoolAddressAlreadyInitialized");
        return Err(CustomError::PoolAddressAlreadyInitialized.into());
    }
    cwar_pool_data.acc_type = AccTypesWithVersion::CwarPoolDataV1 as u8;
    cwar_pool_data.owner_wallet = *pool_owner_wallet_account.key;
    cwar_pool_data.cwar_staking_vault = *cwar_staking_vault.key;
    cwar_pool_data.cwar_staking_mint = *cwar_staking_mint.key;
    cwar_pool_data.cwar_reward_vault = *cwar_rewards_vault.key;
    cwar_pool_data.cwar_reward_mint = *cwar_rewards_mint.key;
    cwar_pool_data.cwar_reward_rate = 0u64;
    cwar_pool_data.cwar_reward_duration = reward_duration;
    cwar_pool_data.total_stake_last_update_time = 0u64;
    cwar_pool_data.cwar_reward_per_token_stored = 0u128;
    cwar_pool_data.user_stake_count = 0u32;
    cwar_pool_data.pda_nonce = bump_seed;
    cwar_pool_data.reward_duration_end = 0u64;

    cwar_pool_data.user_stake_count += 1u32;

    cwar_pool_data_byte_array[0usize..CWAR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&cwar_pool_data.try_to_vec().unwrap());

    Ok(())
}
