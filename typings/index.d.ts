import { Transaction } from 'sequelize/types';

declare module 'morgan-debug';

declare module 'nodemailer-express-handlebars';

declare module 'nodemailer-express-handlebars-plaintext-inline-ccs';

/**
 * Options for all repository methods.
 */
export interface RepositoryQueryOptions {
  [key: string]: unknown;
  transaction?: Transaction;
}
