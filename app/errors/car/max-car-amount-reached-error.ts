import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if user tries to add a car to a group which
 * has already reached to maximal car amount.
 */
export class MaxCarAmountReachedError extends BadRequestError {
  /**
   * The reached amount of cars.
   */
  public amount!: number;

  /**
   * Creates an instance of this class.
   * @param amount  - The reached amount of cars
   */
  constructor(amount: number) {
    super(`The group has reached the maximum amount of ${amount} cars`,
        {amount});

    this.amount = amount;
  }
}
