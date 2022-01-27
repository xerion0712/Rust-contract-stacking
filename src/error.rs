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
    /// Expected Account Type Mismatched
    #[error("Expected Account Type Mismatched")]
    ExpectedAccountTypeMismatched,
    /// Invalid Token Program Id
    #[error("Invalid Token Program Id")]
    InvalidTokenProgram,
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
    /// Mint Mismatched
    #[error("Mint Mismatched")]
    MintMismatched,
    /// User Storage Authority Mismatched
    #[error("User Storage Authority Mismatched")]
    UserStorageAuthorityMismatched,
    /// User Pool Mismatched
    #[error("User Pool Mismatched")]
    UserPoolMismatched,
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
    // Pool Address Already Initialized
    #[error("Pool Address Already Initialized")]
    PoolAddressAlreadyInitialized,
    // Pool Address Already Initialized
    #[error("User claim reward timeout didn't expired")]
    UserClaimRewardTimeout,
    // Pool Address Already Initialized
    #[error("User final unstake timeout didn't expired")]
    UserFinalUnstakeTimeout,
}

impl From<CustomError> for ProgramError {
    fn from(e: CustomError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
