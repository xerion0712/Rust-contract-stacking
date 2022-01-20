import {PublicKey} from '@solana/web3.js';
import {Pubkeys} from '../constants';
import {findAssociatedTokenAddress} from '../utils';
import {ConnectionService} from '../config/connection-service';
import BN from 'bn.js';

/**
 * Get amount of CWAR in the given wallet
 *
 * @param walletPublicKey wallet pubkey
 * @returns amount of CWAR in the given wallet
 */
export async function getCwarWalletBalance(walletPublicKey: PublicKey): Promise<number> {
  const connection = ConnectionService.getConnection();

  const cwarAssociatedAccPubkey = await findAssociatedTokenAddress(
    walletPublicKey,
    Pubkeys.cwarTokenMintPubkey
  );

  let balance;

  try {
    balance = await connection.getTokenAccountBalance(
      new PublicKey(cwarAssociatedAccPubkey)
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
      Pubkeys.cwarStakingVaultPubkey
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
      Pubkeys.cwarStakingVaultPubkey
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
      Pubkeys.cwarRewardsVaultPubkey
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
      Pubkeys.cwarRewardsVaultPubkey
    );
  } catch (err) {
    console.log(err);
    return new BN(0);
  }

  return balance.value.amount ?? 0;
}