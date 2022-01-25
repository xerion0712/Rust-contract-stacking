use crate::instruction::Instruction;

use {
    claim_rewards::process_claim_rewards, close_pool::process_close_pool,
    close_user::process_close_user, create_user::process_create_user,
    initialize_pool::process_initialize_your_pool, stake::process_stake, unstake::process_unstake,
};

pub mod claim_rewards;
pub mod close_pool;
pub mod close_user;
pub mod create_user;
pub mod initialize_pool;
pub mod stake;
pub mod unstake;

use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, msg, pubkey::Pubkey};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = Instruction::unpack(instruction_data)?;
        match instruction {
            Instruction::InitializePool {
                reward_duration,
                pool_nonce,
                fund_amount,
            } => {
                msg!("Instruction::InitializePool");
                process_initialize_your_pool(
                    accounts,
                    reward_duration,
                    pool_nonce,
                    fund_amount,
                    program_id,
                )
            }
            Instruction::CreateUser { nonce } => {
                msg!("Instruction::CreateUser");
                process_create_user(accounts, nonce, program_id)
            }

            Instruction::Stake { amount_to_deposit } => {
                msg!("Instruction::Stake");
                process_stake(accounts, amount_to_deposit, program_id)
            }

            Instruction::Unstake { amount_to_withdraw } => {
                msg!("Instruction::Unstake");
                process_unstake(accounts, amount_to_withdraw, program_id)
            }

            Instruction::ClaimRewards {} => {
                msg!("Instruction::ClaimRewards");
                process_claim_rewards(accounts, program_id)
            }

            Instruction::ClosePool {} => {
                msg!("Instruction::ClosePool");
                process_close_pool(accounts, program_id)
            }

            Instruction::CloseUser {} => {
                msg!("Instruction::CloseUser");
                process_close_user(accounts, program_id)
            }
        }
    }
}
