import {
  getAdminAccount,
  requestAirdrop,
  setupTest,
  timeout,
} from './testHelpers';
import {Keypair, sendAndConfirmTransaction, Transaction} from '@solana/web3.js';
import {
  createInitializePoolTransaction,
  stakeCwarTransaction,
  claimRewardsTransaction,
  createUserTransaction,
  unstakeCwarTransaction,
} from '../src/transactions';
import {ConnectionService} from '../src/config';
import {Constants, Pubkeys} from '../src/constants';
import BN from 'bn.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from '@solana/spl-token';
import {findAssociatedTokenAddress} from '../src/utils';

setupTest();

describe('Claim Rewards Transaction', () => {
  const adminAccount: Keypair = getAdminAccount();
  let cwarPoolStorageAccount: Keypair;
  let cwarStakingVault: Keypair;
  let cwarRewardsVault: Keypair;
  let rewardDurationInDays: number;
  let user1Wallet: Keypair;
  let user2Wallet: Keypair;
  const cwarDecimals = 9;
  const rewardTokenDecimals = 9;
  beforeEach(async () => {
    Constants.cwarDecimals = cwarDecimals;
    Constants.rewardTokenDecimals = rewardTokenDecimals;

    //initialize pool
    const connection = ConnectionService.getConnection();

    // Create Cwar Test Token
    const cwarTokenMint = await Token.createMint(
      connection,
      adminAccount,
      adminAccount.publicKey,
      null,
      cwarDecimals,
      TOKEN_PROGRAM_ID
    );
    Pubkeys.stakingMintPubkey = cwarTokenMint.publicKey;
    Pubkeys.cwarTokenMintPubkey = cwarTokenMint.publicKey;

    // Create Reward Test Token
    const rewardTokenMint = await Token.createMint(
      connection,
      adminAccount,
      adminAccount.publicKey,
      null,
      rewardTokenDecimals,
      TOKEN_PROGRAM_ID
    );
    Pubkeys.rewardsMintPubkey = rewardTokenMint.publicKey;

    cwarPoolStorageAccount = Keypair.generate();
    cwarStakingVault = Keypair.generate();
    cwarRewardsVault = Keypair.generate();
    rewardDurationInDays = 1;

      /////////////////
      const funderRewardTokenAta = await findAssociatedTokenAddress(
          adminAccount.publicKey,
          Pubkeys.rewardsMintPubkey
      );

      const funderRewardAtaInfo = await connection.getAccountInfo(
          funderRewardTokenAta
      );

      const doesRewardsAtaExist = funderRewardAtaInfo?.owner !== undefined;

      if (!doesRewardsAtaExist) {
          const createFunderRewardsAtaIx =
              Token.createAssociatedTokenAccountInstruction(
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                  TOKEN_PROGRAM_ID,
                  Pubkeys.rewardsMintPubkey,
                  funderRewardTokenAta,
                  adminAccount.publicKey,
                  adminAccount.publicKey
              );
          const createFunderRewardsAtaTx = new Transaction().add(
              createFunderRewardsAtaIx
          );
          await sendAndConfirmTransaction(connection, createFunderRewardsAtaTx, [
              adminAccount,
          ]);
      }

      // Mint 10000 Reward token to funder wallet for fund pool
      const rewardsTokenToMint: number = 10000;
      const rewardTokensToMintRaw = new BN(rewardsTokenToMint)
          .mul(new BN(Constants.toCwarRaw))
          .toArray('le', 8);
      await rewardTokenMint.mintTo(
          funderRewardTokenAta,
          adminAccount.publicKey,
          [],
          new u64(rewardTokensToMintRaw)
      );
      /////////////////

    await requestAirdrop(adminAccount.publicKey);
    const initializePoolTx = await createInitializePoolTransaction(
      adminAccount.publicKey,
      cwarPoolStorageAccount,
      cwarStakingVault,
      cwarRewardsVault,
      rewardDurationInDays,
86400
    );
    await sendAndConfirmTransaction(connection, initializePoolTx, [
      adminAccount,
      cwarPoolStorageAccount,
      cwarStakingVault,
      cwarRewardsVault,
    ]);
    Pubkeys.cwarPoolStoragePubkey = cwarPoolStorageAccount.publicKey;
    Pubkeys.cwarStakingVaultPubkey = cwarStakingVault.publicKey;
    Pubkeys.cwarRewardsVaultPubkey = cwarRewardsVault.publicKey;

    user1Wallet = Keypair.generate();
    await requestAirdrop(user1Wallet.publicKey);
    // mint 1000 Cwar Test Tokens to user1 for Staking
    const user1CwarTokenAta = await findAssociatedTokenAddress(
      user1Wallet.publicKey,
      Pubkeys.cwarTokenMintPubkey
    );

    const user1CwarAtaInfo = await connection.getAccountInfo(user1CwarTokenAta);

    const doesUser1CwarAtaExist = user1CwarAtaInfo?.owner !== undefined;

    if (!doesUser1CwarAtaExist) {
      const createUserCwarAtaIx = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        Pubkeys.cwarTokenMintPubkey,
        user1CwarTokenAta,
        user1Wallet.publicKey,
        user1Wallet.publicKey
      );
      const createUserCwarAtaTx = new Transaction().add(createUserCwarAtaIx);
      await sendAndConfirmTransaction(connection, createUserCwarAtaTx, [
        user1Wallet,
      ]);
    }
    const cwarTokensToMint: number = 1000;
    const cwarTokensToMintRaw = new BN(cwarTokensToMint)
      .mul(new BN(Constants.toCwarRaw))
      .toArray('le', 8);
    await cwarTokenMint.mintTo(
      user1CwarTokenAta,
      adminAccount.publicKey,
      [],
      new u64(cwarTokensToMintRaw)
    );


    user2Wallet = Keypair.generate();
    await requestAirdrop(user2Wallet.publicKey);
    // mint 1000 Cwar Test Tokens to user2 for Staking
    const user2CwarTokenAta = await findAssociatedTokenAddress(
      user2Wallet.publicKey,
      Pubkeys.cwarTokenMintPubkey
    );

    const user2CwarAtaInfo = await connection.getAccountInfo(user2CwarTokenAta);

    const doesUser2CwarAtaExist = user2CwarAtaInfo?.owner !== undefined;

    if (!doesUser2CwarAtaExist) {
      const createUserCwarAtaIx = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        Pubkeys.cwarTokenMintPubkey,
        user2CwarTokenAta,
        user2Wallet.publicKey,
        user2Wallet.publicKey
      );
      const createUserCwarAtaTx = new Transaction().add(createUserCwarAtaIx);
      await sendAndConfirmTransaction(connection, createUserCwarAtaTx, [
        user2Wallet,
      ]);
    }
    
    await cwarTokenMint.mintTo(
      user2CwarTokenAta,
      adminAccount.publicKey,
      [],
      new u64(cwarTokensToMintRaw)
    );

    //create user1
    const createUser1Tx = await createUserTransaction(user1Wallet.publicKey);
    await sendAndConfirmTransaction(connection, createUser1Tx, [user1Wallet]);

    //create user2
    const createUser2Tx = await createUserTransaction(user2Wallet.publicKey);
    await sendAndConfirmTransaction(connection, createUser2Tx, [user2Wallet]);

  });

  test('Claim Rewards with 1 user in pool', async () => {
    const connection = ConnectionService.getConnection();

        // stake tokens
        const amountToStake = 1000;
        const stakeCwarTx = await stakeCwarTransaction(
          user1Wallet.publicKey,
          amountToStake
        );
        await sendAndConfirmTransaction(connection, stakeCwarTx, [user1Wallet]);

    //createInitializePoolTransaction()
    const user1RewardTokenATA = await findAssociatedTokenAddress(
      user1Wallet.publicKey,
      Pubkeys.rewardsMintPubkey
    );

    await timeout(1_000);
    // const user1RewardTokenBalanceBefore = await connection.getTokenAccountBalance(
    //     user1RewardTokenATA
    //   );
    //   console.log('user1RewardTokenBalanceBefore: ', user1RewardTokenBalanceBefore.value.uiAmount);
    const claimRewardsTx = await claimRewardsTransaction(user1Wallet.publicKey);
    await sendAndConfirmTransaction(connection, claimRewardsTx, [user1Wallet]);

    const user1RewardTokenBalanceAfter = await connection.getTokenAccountBalance(
      user1RewardTokenATA
    );
    console.log(
      'user1RewardTokenBalanceAfter: ',
      user1RewardTokenBalanceAfter.value.uiAmount
    );
    console.log(
      'user1RewardTokenBalanceRawAfter: ',
      user1RewardTokenBalanceAfter.value.amount
    );
  });

  test('Claim Rewards with 2 users in pool', async () => {
    const connection = ConnectionService.getConnection();
    await timeout(7_000);
        // stake 100 tokens from user1
        const amount1ToStake = 100;
        const stakeCwarTx1 = await stakeCwarTransaction(
          user1Wallet.publicKey,
          amount1ToStake
        );
        await sendAndConfirmTransaction(connection, stakeCwarTx1, [user1Wallet]);
        await timeout(2_000);
        // stake 100 tokens from user2
        const amount2ToStake = 100;
        const stakeCwarTx2 = await stakeCwarTransaction(
          user2Wallet.publicKey,
          amount2ToStake
        );
        await sendAndConfirmTransaction(connection, stakeCwarTx2, [user2Wallet]);
        await timeout(5_000);

        // Unstake 100 Tokens User1
    const amount1ToUnstake = 100;
    const unstakeCwarTx1 = await unstakeCwarTransaction(
      user1Wallet.publicKey,
      amount1ToUnstake
    );
    await sendAndConfirmTransaction(connection, unstakeCwarTx1, [user1Wallet]);

    await timeout(4_000);
 // Unstake 100 Tokens User2
 const amount2ToUnstake = 100;
 const unstakeCwarTx2 = await unstakeCwarTransaction(
   user2Wallet.publicKey,
   amount2ToUnstake
 );
 await sendAndConfirmTransaction(connection, unstakeCwarTx2, [user2Wallet]);


    //createInitializePoolTransaction()
    const user1RewardTokenATA = await findAssociatedTokenAddress(
      user1Wallet.publicKey,
      Pubkeys.rewardsMintPubkey
    );

    const user2RewardTokenATA = await findAssociatedTokenAddress(
      user2Wallet.publicKey,
      Pubkeys.rewardsMintPubkey
    );

    await timeout(1_000);
    // const user1RewardTokenBalanceBefore = await connection.getTokenAccountBalance(
    //     user1RewardTokenATA
    //   );
    //   console.log('user1RewardTokenBalanceBefore: ', user1RewardTokenBalanceBefore.value.uiAmount);
    const claimRewardsTx1 = await claimRewardsTransaction(user1Wallet.publicKey);
    await sendAndConfirmTransaction(connection, claimRewardsTx1, [user1Wallet]);

    const claimRewardsTx2 = await claimRewardsTransaction(user2Wallet.publicKey);
    await sendAndConfirmTransaction(connection, claimRewardsTx2, [user2Wallet]);

    const user1RewardTokenBalanceAfter = await connection.getTokenAccountBalance(
      user1RewardTokenATA
    );

    const user2RewardTokenBalanceAfter = await connection.getTokenAccountBalance(
      user2RewardTokenATA
    );
    console.log(
      'user1RewardTokenBalanceAfter: ',
      user1RewardTokenBalanceAfter.value.uiAmount
    );
    console.log(
      'user1RewardTokenBalanceRawAfter: ',
      user1RewardTokenBalanceAfter.value.amount
    );

    console.log(
      'user2RewardTokenBalanceAfter: ',
      user2RewardTokenBalanceAfter.value.uiAmount
    );
    console.log(
      'user2RewardTokenBalanceRawAfter: ',
      user2RewardTokenBalanceAfter.value.amount
    );
  });

  test('Claim Rewards with 2 users in pool with multiple stake and unstake', async () => {
    const connection = ConnectionService.getConnection();
    await timeout(7_000);
        // stake 100 tokens from user1
        const amount1ToStake = 100;
        const stakeCwarTx1 = await stakeCwarTransaction(
          user1Wallet.publicKey,
          amount1ToStake
        );
        await sendAndConfirmTransaction(connection, stakeCwarTx1, [user1Wallet]);
        await timeout(2_000);
        // stake 100 tokens from user2
        const amount2ToStake = 100;
        const stakeCwarTx2 = await stakeCwarTransaction(
          user2Wallet.publicKey,
          amount2ToStake
        );
        await sendAndConfirmTransaction(connection, stakeCwarTx2, [user2Wallet]);
        await timeout(3_000);

        // stake 100 tokens from user1
        const amount3ToStake = 100;
        const stakeCwarTx3 = await stakeCwarTransaction(
          user1Wallet.publicKey,
          amount3ToStake
        );
        await sendAndConfirmTransaction(connection, stakeCwarTx3, [user1Wallet]);
        await timeout(2_000);

        // Unstake 200 Tokens User1
    const amount1ToUnstake = 200;
    const unstakeCwarTx1 = await unstakeCwarTransaction(
      user1Wallet.publicKey,
      amount1ToUnstake
    );
    await sendAndConfirmTransaction(connection, unstakeCwarTx1, [user1Wallet]);

    await timeout(4_000);
 // Unstake 100 Tokens User2
 const amount2ToUnstake = 100;
 const unstakeCwarTx2 = await unstakeCwarTransaction(
   user2Wallet.publicKey,
   amount2ToUnstake
 );
 await sendAndConfirmTransaction(connection, unstakeCwarTx2, [user2Wallet]);


    //createInitializePoolTransaction()
    const user1RewardTokenATA = await findAssociatedTokenAddress(
      user1Wallet.publicKey,
      Pubkeys.rewardsMintPubkey
    );

    const user2RewardTokenATA = await findAssociatedTokenAddress(
      user2Wallet.publicKey,
      Pubkeys.rewardsMintPubkey
    );

    await timeout(1_000);
    // const user1RewardTokenBalanceBefore = await connection.getTokenAccountBalance(
    //     user1RewardTokenATA
    //   );
    //   console.log('user1RewardTokenBalanceBefore: ', user1RewardTokenBalanceBefore.value.uiAmount);
    const claimRewardsTx1 = await claimRewardsTransaction(user1Wallet.publicKey);
    await sendAndConfirmTransaction(connection, claimRewardsTx1, [user1Wallet]);

    const claimRewardsTx2 = await claimRewardsTransaction(user2Wallet.publicKey);
    await sendAndConfirmTransaction(connection, claimRewardsTx2, [user2Wallet]);

    const user1RewardTokenBalanceAfter = await connection.getTokenAccountBalance(
      user1RewardTokenATA
    );

    const user2RewardTokenBalanceAfter = await connection.getTokenAccountBalance(
      user2RewardTokenATA
    );
    console.log(
      'user1RewardTokenBalanceAfter: ',
      user1RewardTokenBalanceAfter.value.uiAmount
    );
    console.log(
      'user1RewardTokenBalanceRawAfter: ',
      user1RewardTokenBalanceAfter.value.amount
    );

    console.log(
      'user2RewardTokenBalanceAfter: ',
      user2RewardTokenBalanceAfter.value.uiAmount
    );
    console.log(
      'user2RewardTokenBalanceRawAfter: ',
      user2RewardTokenBalanceAfter.value.amount
    );
  });
});
