import {getAdminAccount, requestAirdrop, setupTest} from './testHelpers';
import {Keypair, sendAndConfirmTransaction, Transaction} from '@solana/web3.js';
import {createInitializePoolTransaction} from '../src/transactions';
import {ConnectionService} from '../src/config';
import {Constants, Pubkeys} from '../src/constants';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {findAssociatedTokenAddress} from '../src/utils';
import BN from 'bn.js';

setupTest();

describe('Initialize Pool Transaction', () => {
  const adminAccount: Keypair = getAdminAccount();
  let cwarPoolStorageAccount: Keypair;
  let cwarStakingVault: Keypair;
  let cwarRewardsVault: Keypair;
  let rewardDurationInDays: number;
  const cwarDecimals = 9;
  const rewardTokenDecimals = 9;
  beforeEach(async () => {
    Constants.cwarDecimals = cwarDecimals;
    Constants.rewardTokenDecimals = rewardTokenDecimals;
    // pool owner wallet == admin
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
    await requestAirdrop(adminAccount.publicKey);

    Pubkeys.cwarStakingVaultPubkey = cwarStakingVault.publicKey;
    Pubkeys.cwarRewardsVaultPubkey = cwarRewardsVault.publicKey;

    console.log("1 ", cwarTokenMint.publicKey.toString());
    console.log("2 ", cwarStakingVault.publicKey.toString());
    console.log("3 ", cwarRewardsVault.publicKey.toString());
    console.log("4 ", adminAccount.publicKey.toString());

    ////////////////////////////////////

    rewardDurationInDays = 1;
    //await requestAirdrop(adminAccount.publicKey);
    const initializePoolTx = await createInitializePoolTransaction(
        adminAccount.publicKey,
        cwarPoolStorageAccount,
        cwarStakingVault,
        cwarRewardsVault,
        rewardDurationInDays
    );
    await sendAndConfirmTransaction(connection, initializePoolTx, [
      adminAccount,
      cwarPoolStorageAccount,
      cwarStakingVault,
      cwarRewardsVault, // here is 'create address' error
    ]);
    Pubkeys.cwarPoolStoragePubkey = cwarPoolStorageAccount.publicKey;
    Pubkeys.cwarStakingVaultPubkey = cwarStakingVault.publicKey;
    Pubkeys.cwarRewardsVaultPubkey = cwarRewardsVault.publicKey;

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
  });

  test('Initialize Pool', async () => {
    const connection = ConnectionService.getConnection();
    const initializePoolTx = await createInitializePoolTransaction(
      adminAccount.publicKey,
      cwarPoolStorageAccount,
      cwarStakingVault,
      cwarRewardsVault,
      rewardDurationInDays
    );
    await sendAndConfirmTransaction(connection, initializePoolTx, [
      adminAccount,
      cwarPoolStorageAccount,
      cwarStakingVault,
      cwarRewardsVault,
    ]);
    Pubkeys.cwarPoolStoragePubkey = cwarPoolStorageAccount.publicKey;
  });
});
