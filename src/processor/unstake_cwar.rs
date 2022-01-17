use crate::{
    error::CustomError,
    processor::create_user::get_user_storage_address_and_bump_seed,
    state::{
        AccTypesWithVersion, CwarPool, User, CWAR_POOL_STORAGE_TOTAL_BYTES,
        USER_STORAGE_TOTAL_BYTES,
    },
    utils,
};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
};
use spl_token::state::Account as TokenAccount;

pub fn process_unstake_cwar(
    accounts: &[AccountInfo],
    amount_to_withdraw: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_wallet_account = next_account_info(account_info_iter)?;
    let user_storage_account = next_account_info(account_info_iter)?;
    let cwar_pool_storage_account = next_account_info(account_info_iter)?;
    let cwar_staking_vault = next_account_info(account_info_iter)?;
    let user_cwar_ata = next_account_info(account_info_iter)?;
    let pool_signer_pda = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !user_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }
    if token_program.key != &spl_token::id() {
        msg!("CustomError::InvalidTokenProgram");
        return Err(CustomError::InvalidTokenProgram.into());
    }

    if amount_to_withdraw == 0u64 {
        msg!("CustomError::AmountMustBeGreaterThanZero");
        return Err(CustomError::AmountMustBeGreaterThanZero.into());
    }

    let (user_storage_address, _bump_seed) = get_user_storage_address_and_bump_seed(
        user_wallet_account.key,
        cwar_pool_storage_account.key,
        program_id,
    );
    if user_storage_address != *user_storage_account.key {
        msg!("Error: User Storage address does not match seed derivation");
        return Err(ProgramError::InvalidSeeds);
    }

    if cwar_pool_storage_account.data_len() != CWAR_POOL_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }
    let mut cwar_pool_data_byte_array = cwar_pool_storage_account.data.try_borrow_mut().unwrap();
    let mut cwar_pool_data: CwarPool =
        CwarPool::try_from_slice(&cwar_pool_data_byte_array[0usize..CWAR_POOL_STORAGE_TOTAL_BYTES])
            .unwrap();
    if cwar_pool_data.acc_type != AccTypesWithVersion::CwarPoolDataV1 as u8 {
        msg!("CustomError::ExpectedAccountTypeMismatched");
        return Err(CustomError::ExpectedAccountTypeMismatched.into());
    }

    if user_storage_account.data_len() != USER_STORAGE_TOTAL_BYTES {
        msg!("CustomError::DataSizeNotMatched");
        return Err(CustomError::DataSizeNotMatched.into());
    }

    let mut user_data_byte_array = user_storage_account.data.try_borrow_mut().unwrap();
    let mut user_storage_data: User =
        User::try_from_slice(&user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]).unwrap();
    if user_storage_data.acc_type != AccTypesWithVersion::UserDataV1 as u8 {
        msg!("CustomError::ExpectedAccountTypeMismatched");
        return Err(CustomError::ExpectedAccountTypeMismatched.into());
    }

    if user_storage_data.user_wallet != *user_wallet_account.key {
        msg!("CustomError::UserStorageAuthorityMismatched");
        return Err(CustomError::UserStorageAuthorityMismatched.into());
    }
    if user_storage_data.cwar_pool != *cwar_pool_storage_account.key {
        msg!("CustomError::UserPoolMismatched");
        return Err(CustomError::UserPoolMismatched.into());
    }

    let cwar_staking_vault_data = TokenAccount::unpack(&cwar_staking_vault.data.borrow())?;
    let (pool_signer_address, bump_seed) =
        Pubkey::find_program_address(&[&cwar_pool_storage_account.key.to_bytes()], program_id);

    if user_storage_data.balance_cwar_staked < amount_to_withdraw {
        msg!("CustomError::InsufficientFundsToUnstake");
        return Err(CustomError::InsufficientFundsToUnstake.into());
    }

    let total_cwar_staked = cwar_staking_vault_data.amount;
    utils::update_rewards(
        &mut cwar_pool_data,
        Some(&mut user_storage_data),
        total_cwar_staked,
    )?;
    msg!("Calling the token program to transfer to User from Staking Vault...");
    invoke_signed(
        &spl_token::instruction::transfer(
            token_program.key,
            cwar_staking_vault.key,
            user_cwar_ata.key,
            &pool_signer_address,
            &[&pool_signer_address],
            amount_to_withdraw,
        )?,
        &[
            cwar_staking_vault.clone(),
            user_cwar_ata.clone(),
            pool_signer_pda.clone(),
            token_program.clone(),
        ],
        &[&[&cwar_pool_storage_account.key.to_bytes(), &[bump_seed]]],
    )?;
    user_storage_data.balance_cwar_staked = user_storage_data
        .balance_cwar_staked
        .checked_sub(amount_to_withdraw)
        .ok_or(CustomError::AmountOverflow)?;
    cwar_pool_data_byte_array[0usize..CWAR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&cwar_pool_data.try_to_vec().unwrap());
    user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&user_storage_data.try_to_vec().unwrap());

    Ok(())
}
