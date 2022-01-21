import {getAdminAccount, requestAirdrop, setupTest} from './testHelpers';
import {Keypair, sendAndConfirmTransaction, Transaction} from '@solana/web3.js';
import {
  createInitializePoolTransaction,
  stakeCwarTransaction,
  createUserTransaction,
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

describe('Stake Cwar Transaction', () => {
  const adminAccount: Keypair = getAdminAccount();
  let cwarPoolStorageAccount: Keypair;
  let cwarStakingVault: Keypair;
  let cwarRewardsVault: Keypair;
  let rewardDurationInDays: number;
  let userWallet: Keypair;
  const cwarDecimals = 9;
  const rewardTokenDecimals = 9;
  beforeEach(async () => {
    Constants.cwarDecimals = cwarDecimals;
    Constants.rewardTokenDecimals = rewardTokenDecimals;

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
        10000
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

    userWallet = Keypair.generate();
    await requestAirdrop(userWallet.publicKey);
    // mint 1000 Cwar Test Tokens to user for Staking
    const userCwarTokenAta = await findAssociatedTokenAddress(
      userWallet.publicKey,
      Pubkeys.cwarTokenMintPubkey
    );

    const userCwarAtaInfo = await connection.getAccountInfo(userCwarTokenAta);

    const doesUserCwarAtaExist = userCwarAtaInfo?.owner !== undefined;

    if (!doesUserCwarAtaExist) {
      const createUserCwarAtaIx = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        Pubkeys.cwarTokenMintPubkey,
        userCwarTokenAta,
        userWallet.publicKey,
        userWallet.publicKey
      );
      const createUserCwarAtaTx = new Transaction().add(createUserCwarAtaIx);
      await sendAndConfirmTransaction(connection, createUserCwarAtaTx, [
        userWallet,
      ]);
    }
    const cwarTokensToMint: number = 1000;
    const cwarTokensToMintRaw = new BN(cwarTokensToMint)
      .mul(new BN(Constants.toCwarRaw))
      .toArray('le', 8);
    await cwarTokenMint.mintTo(
      userCwarTokenAta,
      adminAccount.publicKey,
      [],
      new u64(cwarTokensToMintRaw)
    );

    //create user
    const createUserTx = await createUserTransaction(userWallet.publicKey);
    await sendAndConfirmTransaction(connection, createUserTx, [userWallet]);
  });

  test('Stake Cwar Tokens', async () => {
    const connection = ConnectionService.getConnection();

    const amountToStake = 1000;
    const stakeCwarTx = await stakeCwarTransaction(
      userWallet.publicKey,
      amountToStake
    );
    await sendAndConfirmTransaction(connection, stakeCwarTx, [userWallet]);
  });
});
