use crate::{
    error::CustomError,
    state,
    state::{
        AccTypesWithVersion, User, YourPool, USER_STORAGE_TOTAL_BYTES,
        YOUR_POOL_STORAGE_TOTAL_BYTES,
    },
};

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction, system_program,
    sysvar::{rent::Rent, Sysvar},
};
use std::convert::TryInto;

use borsh::{BorshDeserialize, BorshSerialize};

pub fn process_create_user(
    accounts: &[AccountInfo],
    nonce: u8,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_wallet_account = next_account_info(account_info_iter)?;
    let user_storage_account = next_account_info(account_info_iter)?;
    let your_pool_storage_account = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;
    msg!("nonce: {}", nonce);
    if !user_wallet_account.is_signer {
        msg!("ProgramError::MissingRequiredSignature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    if *system_program_info.key != system_program::id() {
        msg!("CustomError::InvalidSystemProgram");
        return Err(CustomError::InvalidSystemProgram.into());
    }

    if !user_storage_account.data_is_empty()
        || user_storage_account.lamports() != 0
        || user_storage_account.data_len() != 0
    {
        msg!("CustomError::UserStorageAccountAlreadyInitialized");
        return Err(CustomError::UserStorageAccountAlreadyInitialized.into());
    }

    let (user_storage_address, bump_seed) = get_user_storage_address_and_bump_seed(
        user_wallet_account.key,
        your_pool_storage_account.key,
        program_id,
    );
    if user_storage_address != *user_storage_account.key {
        msg!("Error: User Storage address does not match seed derivation");
        return Err(ProgramError::InvalidSeeds);
    }

    let user_storage_account_signer_seeds: &[&[_]] = &[
        &user_wallet_account.key.to_bytes(),
        &your_pool_storage_account.key.to_bytes(),
        &[bump_seed],
    ];

    create_and_allocate_account_raw(
        *program_id,
        user_storage_account,
        system_program_info,
        user_wallet_account,
        state::USER_STORAGE_TOTAL_BYTES,
        user_storage_account_signer_seeds,
    )
    .unwrap();

    let user_storage_data = User {
        acc_type: state::AccTypesWithVersion::UserDataV1 as u8,
        user_wallet: *user_wallet_account.key,
        your_pool: *your_pool_storage_account.key,
        balance_your_staked: 0u64,
        nonce: bump_seed,
        your_reward_per_token_pending: 0u64,
        your_reward_per_token_completed: 0u128,
    };

    let mut user_data_byte_array = user_storage_account.data.try_borrow_mut().unwrap();

    user_data_byte_array[0usize..USER_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&user_storage_data.try_to_vec().unwrap());

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

    your_pool_data.user_stake_count += 1u32;

    your_pool_data_byte_array[0usize..YOUR_POOL_STORAGE_TOTAL_BYTES]
        .copy_from_slice(&your_pool_data.try_to_vec().unwrap());

    Ok(())
}

#[inline(always)]
pub fn create_and_allocate_account_raw<'a>(
    owner_program_id: Pubkey,
    new_account_info: &AccountInfo<'a>,
    system_program_info: &AccountInfo<'a>,
    payer_info: &AccountInfo<'a>,
    size: usize,
    signer_seeds: &[&[u8]],
) -> Result<(), ProgramError> {
    let rent = Rent::get()?;
    let required_lamports = rent
        .minimum_balance(size)
        .max(1)
        .saturating_sub(new_account_info.lamports());

    if required_lamports > 0 {
        msg!("Transfer {} lamports to the new account", required_lamports);
        invoke(
            &system_instruction::transfer(payer_info.key, new_account_info.key, required_lamports),
            &[
                payer_info.clone(),
                new_account_info.clone(),
                system_program_info.clone(),
            ],
        )?;
    }

    msg!("Allocate space for the account");
    invoke_signed(
        &system_instruction::allocate(new_account_info.key, size.try_into().unwrap()),
        &[new_account_info.clone(), system_program_info.clone()],
        &[signer_seeds],
    )?;

    msg!("Assign the account to the owning program");
    invoke_signed(
        &system_instruction::assign(new_account_info.key, &owner_program_id),
        &[new_account_info.clone(), system_program_info.clone()],
        &[signer_seeds],
    )?;
    msg!("Completed assignation!");

    Ok(())
}

pub fn assert_derivation(
    program_id: &Pubkey,
    account: &AccountInfo,
    path: &[&[u8]],
) -> Result<u8, ProgramError> {
    let (key, bump) = Pubkey::find_program_address(&path, program_id);
    if key != *account.key {
        return Err(CustomError::DerivedKeyInvalid.into());
    }
    Ok(bump)
}

/// Derives the user storage account address for the given wallet and pool
pub fn get_user_storage_address(
    user_wallet: &Pubkey,
    pool_storage: &Pubkey,
    program_id: &Pubkey,
) -> Pubkey {
    get_user_storage_address_and_bump_seed(user_wallet, pool_storage, program_id).0
}

pub fn get_user_storage_address_and_bump_seed(
    user_wallet: &Pubkey,
    pool_storage: &Pubkey,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[&user_wallet.to_bytes(), &pool_storage.to_bytes()],
        program_id,
    )
}
