use crate::{
    error::CustomError,
    state::{AccTypesWithVersion, YourPool, YOUR_POOL_STORAGE_TOTAL_BYTES},
    utils,
};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    sysvar::Sysvar,
};
use spl_token::state::Account as TokenAccount;

/// 0. `[signer]` Funder Wallet Account
/// 1. `[writable]` CWAR Pool Storage Account
/// 2. `[writable]` CWAR Staking Vault
/// 3. `[writable]` CWAR Reward Vault
/// 4. `[writable]` CWAR ATA to Debit (Reward Token)
/// 5. `[]` Pool Signer [pool storage, program id]
/// 6. `[]` Token Program
pub fn process_fund_pool(
    accounts: &[AccountInfo],
    amount: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let funder_wallet_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let your_staking_vault = next_account_info(account_info_iter)?;
    let your_rewards_vault = next_account_info(account_info_iter)?;
    let your_rewards_ata_to_debit = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    //    let pool_signer_pda = next_account_info(account_info_iter)?;

    if !funder_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    if your_pool_storage_account.data_len() != YOUR_POOL_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }
    let mut your_pool_data_byte_array = your_pool_storage_account.data.try_borrow_mut().unwrap();
    let mut your_pool_data: YourPool =
        YourPool::try_from_slice(&your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES])
            .unwrap();

    if your_pool_data.acc_type != AccTypesWithVersion::YourPoolDataV1 as u8 {
        msg!("CustomError::ExpectedAccountTypeMismatched");
        return Err(CustomError::ExpectedAccountTypeMismatched.into());
    }

    let mut is_funder_authorised = false;
    if *funder_wallet_account.key == your_pool_data.owner_wallet {
        is_funder_authorised = true;
    }

    if your_pool_data
        .funders
        .iter()
        .any(|x| *x == *funder_wallet_account.key)
    {
        is_funder_authorised = true;
    }

    if !is_funder_authorised {
        msg!("CustomError::FundingAuthorityMismatched");
        return Err(CustomError::FundingAuthorityMismatched.into());
    }

    if your_staking_vault.owner != token_program.key {
        msg!("CustomError::AccountOwnerShouldBeTokenProgram");
        return Err(CustomError::AccountOwnerShouldBeTokenProgram.into());
    }

    let your_staking_vault_data = TokenAccount::unpack(&your_staking_vault.data.borrow())?;
    let (pool_signer_address, _bump_seed) =
        Pubkey::find_program_address(&[&your_pool_storage_account.key.to_bytes()], program_id);

    if your_staking_vault_data.owner != pool_signer_address {
        msg!("CustomError::InvalidStakingVault");
        return Err(CustomError::InvalidStakingVault.into());
    }

    let total_your_staked = your_staking_vault_data.amount;
    utils::update_rewards(&mut your_pool_data, None, total_your_staked)?;

    let now = Clock::get()?.unix_timestamp as u64;
    let reward_duration_end = your_pool_data.reward_duration_end;
    msg!("now: {}", now);
    msg!("reward_duration_end: {}", reward_duration_end);
    msg!("amount: {}", amount);
    if now < reward_duration_end {
        let remaining_duration = reward_duration_end
            .checked_sub(now)
            .ok_or(CustomError::AmountOverflow)?;
        let rewards_left_amount = remaining_duration
            .checked_mul(your_pool_data.your_reward_rate)
            .ok_or(CustomError::AmountOverflow)?;
        your_pool_data.your_reward_rate = amount
            .checked_add(rewards_left_amount)
            .ok_or(CustomError::AmountOverflow)?
            .checked_div(your_pool_data.your_reward_duration)
            .ok_or(CustomError::AmountOverflow)?;
    } else {
        your_pool_data.your_reward_rate = amount
            .checked_div(your_pool_data.your_reward_duration)
            .ok_or(CustomError::AmountOverflow)?;
    }

    if amount > 0 {
        msg!("Calling the token program to transfer CWAR rewards to Rewards Vault...");
        invoke(
            &spl_token::instruction::transfer(
                token_program.key,
                your_rewards_ata_to_debit.key,
                your_rewards_vault.key,
                funder_wallet_account.key,
                &[],
                amount,
            )?,
            &[
                your_rewards_ata_to_debit.clone(),
                your_rewards_vault.clone(),
                funder_wallet_account.clone(),
                token_program.clone(),
            ],
        )?;
    }
    msg!(
        "cwar_pool_data.cwar_reward_rate: {}",
        your_pool_data.your_reward_rate
    );
    your_pool_data.total_stake_last_update_time = now;
    your_pool_data.reward_duration_end = now
        .checked_add(your_pool_data.your_reward_duration)
        .ok_or(CustomError::AmountOverflow)?;
    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());
    Ok(())
}
