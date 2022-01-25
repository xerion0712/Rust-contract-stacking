export abstract class YourStakingError extends Error {}

export class AccountNotFoundError extends YourStakingError {
  constructor(public accountName = '') {
    super(`Account ${accountName} not found`);
  }
}
