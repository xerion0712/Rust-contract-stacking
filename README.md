# Solana Smart Contract

A decentralized staking platform built on Solana blockchain that allows users to stake tokens and earn rewards. This project consists of a Rust smart contract (program) and a TypeScript interface for interacting with the blockchain.

## Features

- **Token Staking**: Users can stake their tokens to earn rewards
- **Reward Distribution**: Automated reward distribution based on staking duration and amount
- **Pool Management**: Initialize and manage staking pools with configurable parameters
- **User Management**: Create user accounts and track individual staking positions
- **Flexible Unstaking**: Partial and complete unstaking options
- **Reward Claims**: Users can claim accumulated rewards
- **Pool Closure**: Administrators can close pools and return funds

## Architecture

### Smart Contract (Rust)
The core staking logic is implemented in Rust as a Solana program:

- **Entrypoint**: Program entry point for processing instructions
- **Instructions**: Defines all supported operations (stake, unstake, claim rewards, etc.)
- **Processor**: Implements the business logic for each instruction
- **State**: Defines data structures for pools, users, and program state
- **Error Handling**: Custom error types for better debugging

### Interface (TypeScript)
A TypeScript library for interacting with the smart contract:

- **Connection Service**: Manages Solana network connections
- **Transaction Builders**: Creates and sends transactions to the blockchain
- **Data Models**: Type-safe interfaces for program data
- **Utilities**: Helper functions for common operations


## Prerequisites

- **Rust**: Latest stable version (1.70+)
- **Solana CLI**: Latest stable version
- **Node.js**: Version 16.0.0 or higher
- **TypeScript**: Version 4.4.2 or higher

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Rust-contract-stacking
```

### 2. Install Rust Dependencies
```bash
cargo build
```

### 3. Install TypeScript Dependencies
```bash
cd interface
npm install
npm run build
```

### 4. Deploy to Local Network
```bash
# From project root
./deploy-localnet.sh
```

## Usage

### Smart Contract Instructions

The program supports the following instructions:

1. **InitializePool**: Create a new staking pool
   - `reward_duration`: Duration of the reward period
   - `pool_nonce`: Unique identifier for the pool
   - `fund_amount`: Initial funding amount

2. **CreateUser**: Create a user account for staking
   - `nonce`: Unique identifier for the user

3. **Stake**: Stake tokens in the pool
   - `amount_to_deposit`: Amount of tokens to stake

4. **Unstake**: Withdraw staked tokens
   - `amount_to_withdraw`: Amount of tokens to withdraw

5. **ClaimRewards**: Claim accumulated rewards

6. **ClosePool**: Close the staking pool (admin only)

7. **CloseUser**: Close a user account

8. **FinalUnstake**: Final unstaking operation

### TypeScript Interface

```typescript
import { ConnectionService } from '@your-staking/blockchain-interface';

// Initialize connection
const connection = new ConnectionService('devnet');

// Create staking transaction
const stakeTx = await createStakeTransaction({
  amount: 1000,
  userAccount: userPubkey,
  poolAccount: poolPubkey
});

// Send transaction
const signature = await connection.sendTransaction(stakeTx);
```

## Testing

### Rust Tests
```bash
cargo test
```

### TypeScript Tests
```bash
cd interface
npm test
```

### Integration Tests
```bash
./test.sh
```

## Configuration

### Network Configuration
The interface supports multiple Solana networks:
- `mainnet-beta`: Production network
- `devnet`: Development network
- `testnet`: Test network
- `localnet`: Local development network

### Token Configuration
- **Your Token Decimals**: 9
- **Max Supply**: 1,000,000,000 tokens
- **Reward Token Decimals**: 9

## API Reference

### Core Functions

- `createStakeTransaction()`: Build stake transaction
- `createUnstakeTransaction()`: Build unstake transaction
- `createClaimRewardsTransaction()`: Build claim rewards transaction
- `createInitializePoolTransaction()`: Build pool initialization transaction
- `createUserTransaction()`: Build user creation transaction

### Data Models

- `PoolInfo`: Pool information and configuration
- `UserInfo`: User staking position and rewards
- `StakingInstructions`: Staking operation parameters

## Error Handling

The program includes comprehensive error handling with custom error types:
- `InvalidInstruction`: Invalid instruction data
- `InsufficientFunds`: Insufficient balance for operation
- `PoolNotFound`: Pool account not found
- `UserNotFound`: User account not found
- `InvalidPoolState`: Pool in invalid state for operation

## Security Considerations

- All operations are validated on-chain
- User accounts are protected by PDA derivation
- Pool operations require proper authorization
- Funds are secured by Solana's account model

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the test files for usage examples
- Review the TypeScript interface documentation

## Version History

- **v0.1.0**: Initial release with core staking functionality
  - Basic staking and unstaking operations
  - Reward distribution system
  - Pool and user management
  - TypeScript interface library

---

**Note**: This is a development version. Use at your own risk and ensure thorough testing before deploying to production networks.

