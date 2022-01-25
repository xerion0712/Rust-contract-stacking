use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum CustomError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
    /// Not Rent Exempt
    #[error("Not Rent Exempt")]
    NotRentExempt,
    /// Expected Amount Mismatch
    #[error("Expected Amount Mismatch")]
    ExpectedAmountMismatch,
    /// Amount Overflow
    #[error("Amount Overflow")]
    AmountOverflow,
    /// Account Not Owned By Program owner
    #[error("Account Not Owned By Program owner")]
    WrongAccountPassed,
    /// Some Other User Is Using This Space
    #[error("Space Not Empty")]
    SpaceNotEmpty,
    /// Expected account is not same as passed account
    #[error("Account Mismatched")]
    AccountMismatched,
    /// Expected Account Type Mismatched
    #[error("Expected Account Type Mismatched")]
    ExpectedAccountTypeMismatched,
    /// Invalid Token Program Id
    #[error("Invalid Token Program Id")]
    InvalidTokenProgram,
    /// Admin Does Not Matched
    #[error("Admin Does Not Matched")]
    AdminDoesNotMatched,
    ///PDA Account Does Not Matched
    #[error("PDA Account Does Not Matched")]
    PdaAccountDoesNotMatched,
    ///Data Size Not Matched
    #[error("Data Size Not Matched")]
    DataSizeNotMatched,
    ///Account Owner Should Be Token Program
    #[error("Account Owner Should Be Token Program")]
    AccountOwnerShouldBeTokenProgram,
    // Derived Key Is Invalid
    #[error("Derived Key Is Invalid")]
    DerivedKeyInvalid,
    ///User Storage Account Already Initialized
    #[error("User Storage Account Already Initialized")]
    UserStorageAccountAlreadyInitialized,
    /// Invalid System Program Id
    #[error("Invalid System Program Id")]
    InvalidSystemProgram,
    /// Duration Too Short
    #[error("Duration Too Short")]
    DurationTooShort,
    /// Mint Mismatched
    #[error("Mint Mismatched")]
    MintMismatched,
    /// User Storage Authority Mismatched
    #[error("User Storage Authority Mismatched")]
    UserStorageAuthorityMismatched,
    /// User Pool Mismatched
    #[error("User Pool Mismatched")]
    UserPoolMismatched,
    /// User Balance NonZero
    #[error("User Balance NonZero")]
    UserBalanceNonZero,
    // Invalid Staking Vault
    #[error("Invalid Staking Vault")]
    InvalidStakingVault,
    // Amount Must Be Greater Than Zero
    #[error("Amount Must Be Greater Than Zero")]
    AmountMustBeGreaterThanZero,
    // Insufficient Funds To Unstake
    #[error("Insufficient Funds To Unstake")]
    InsufficientFundsToUnstake,
    /// Pool Owner Mismatched
    #[error("Pool Owner Mismatched")]
    PoolOwnerMismatched,
    /// Pool Still Active
    #[error("Pool Still Active")]
    PoolStillActive,
    /// Funder Already Present
    #[error("Funder Already Present")]
    FunderAlreadyPresent,
    /// Max Funders Reached
    #[error("Max Funders Reached")]
    MaxFundersReached,
    /// Cannot Remove Pool Owner
    #[error("Cannot Remove Pool Owner")]
    CannotRemovePoolOwner,
    /// Funder Is Not Present In Funder List
    #[error("Funder Is Not Present In Funder List")]
    FunderNotPresent,
    // Pool Address Already Initialized
    #[error("Pool Address Already Initialized")]
    PoolAddressAlreadyInitialized,
    // Pool Address Already Initialized
    #[error("User claim reward timeout didn't expired")]
    UserClaimRewardTimeout,
}

impl From<CustomError> for ProgramError {
    fn from(e: CustomError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
