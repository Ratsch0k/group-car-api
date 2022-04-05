import sequelize from 'sequelize';
import {Transaction} from '../../typings';

/**
 * Custom type guard which takes a custom transaction and turns it into the
 * correct transaction type.
 * @param t - Input transaction
 */
export const isTransaction = (
    t: Transaction | undefined,
): sequelize.Transaction | undefined => {
  return t as sequelize.Transaction;
};

interface ObjectWithT {
  transaction?: Transaction;
}

interface ObjectWithSequelizeT {
  transaction?: sequelize.Transaction;
}

/**
 * Complex type alias for the return value of {@link containsTransaction}.
 * If the generic **T** extends has a field `transaction` with
 * the custom type. Then, this type will replace the custom
 * transaction type with the sequelize type. If it doesn't have
 * the transaction property or with the required type, then it
 * will be the input type.
 */
type ContainsTransactionReturn<T> = T extends ObjectWithT ?
  Omit<T, 'transaction'> & ObjectWithSequelizeT :
  T;

/**
 * Type guard which converts an object with the custom
 * transaction type into an object with the sequelize transaction type.
 * @param o - The object of which to convert the type
 */
export const containsTransaction = <T extends unknown>(
  o: (T & ObjectWithT) | undefined,
): ContainsTransactionReturn<typeof o> => {
  return o as unknown as ContainsTransactionReturn<typeof o>;
};
