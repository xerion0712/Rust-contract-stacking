import {PublicKey} from '@solana/web3.js';
import {Pubkeys} from '../constants';
import {findAssociatedTokenAddress} from '../utils';
import {ConnectionService} from '../config/connection-service';
import BN from 'bn.js';

/**
 * Get amount of YOUR in the given wallet
 *
 * @param walletPublicKey wallet pubkey
 * @returns amount of YOUR in the given wallet
 */
export async function getYourWalletBalance(walletPublicKey: PublicKey): Promise<number> {
  const connection = ConnectionService.getConnection();

  const yourAssociatedAccPubkey = await findAssociatedTokenAddress(
    walletPublicKey,
    Pubkeys.yourTokenMintPubkey
  );

  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      new PublicKey(yourAssociatedAccPubkey)
    );
  } catch (err) {
    console.log(err);
    return 0;
  }

  return balance.value.uiAmount ?? 0;
}

export async function getStakingTokenWalletBalance(walletPublicKey: PublicKey): Promise<number> {
  const connection = ConnectionService.getConnection();

  const stakingTokenAssociatedAccPubkey = await findAssociatedTokenAddress(
    walletPublicKey,
    Pubkeys.stakingMintPubkey
  );

  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      new PublicKey(stakingTokenAssociatedAccPubkey)
    );
  } catch (err) {
    console.log(err);
    return 0;
  }

  return balance.value.uiAmount ?? 0;
}

export async function getRewardTokenWalletBalance(walletPublicKey: PublicKey): Promise<number> {
  const connection = ConnectionService.getConnection();

  const rewardTokenAssociatedAccPubkey = await findAssociatedTokenAddress(
    walletPublicKey,
    Pubkeys.rewardsMintPubkey
  );

  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      new PublicKey(rewardTokenAssociatedAccPubkey)
    );
  } catch (err) {
    console.log(err);
    return 0;
  }

  return balance.value.uiAmount ?? 0;
}

export async function getStakingVaultBalance(): Promise<number> {
  const connection = ConnectionService.getConnection();
  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      Pubkeys.yourStakingVaultPubkey
    );
  } catch (err) {
    console.log(err);
    return 0;
  }

  return balance.value.uiAmount ?? 0;
}

export async function getStakingVaultBalanceRaw(): Promise<BN> {
  const connection = ConnectionService.getConnection();
  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      Pubkeys.yourStakingVaultPubkey
    );
  } catch (err) {
    console.log(err);
    return new BN(0);
  }

  return balance.value.amount ?? 0;
}

export async function getRewardsVaultBalance(): Promise<number> {
  const connection = ConnectionService.getConnection();
  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      Pubkeys.yourRewardsVaultPubkey
    );
  } catch (err) {
    console.log(err);
    return 0;
  }

  return balance.value.uiAmount ?? 0;
}

export async function getRewardsVaultBalanceRaw(): Promise<BN> {
  const connection = ConnectionService.getConnection();
  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      Pubkeys.yourRewardsVaultPubkey
    );
  } catch (err) {
    console.log(err);
    return new BN(0);
  }

  return balance.value.amount ?? 0;
}