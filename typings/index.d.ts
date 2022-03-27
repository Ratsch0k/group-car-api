import { Transaction } from 'sequelize/types';
import {ExtendedValidationChain} from '@app/validators';

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

/**
 * For why this is here, look at `app/validators/inject-custom-checks.ts`
 */
declare module 'express-validator' {
  export interface ValidationChain extends ExtendedValidationChain {}
}