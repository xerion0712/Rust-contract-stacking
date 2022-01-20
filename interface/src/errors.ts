export abstract class CwarStakingError extends Error {}

export class AccountNotFoundError extends CwarStakingError {
  constructor(public accountName = '') {
    super(`Account ${accountName} not found`);
  }
}
