import {Config} from './config.d';
import dbConfig from './database-config';
import jwt from './jwt-config';
import {Config as SequelizeConfig} from 'sequelize';
const environment = process.env.NODE_ENV || 'development';
const sequelize: SequelizeConfig =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dbConfig as any)[environment];
import path from 'path';

const defaultConfig: Config = {
  database: {
    sequelize,
    withFlush: false,
  },
  bcrypt: {
    saltRounds: 8,
  },
  static: {
    path: path.resolve('./static'),
    disabled: false,
  },
  error: {
    withStack: false,
  },
  jwt,
  morgan: {
    formatString: 'dev',
  },
  user: {
    pb: {
      dimensions: 128,
    },
    signUpThroughRequest: true,
    maxLimitQuery: 20,
    maxUsernameLength: 25,
  },
  serverType: 'release',
  group: {
    maxMembers: 25,
    maxCars: 8,
  },
  mail: {
    accountRequest: {
      type: process.env.MAIL_ACCOUNT_REQUEST_TYPE,
      receiver: process.env.MAIL_ACCOUNT_REQUEST_RECEIVER,
      options: {
        service: process.env.MAIL_ACCOUNT_REQUEST_SERVICE,
        host: process.env.MAIL_ACCOUNT_REQUEST_HOST,
        port: process.env.MAIL_ACCOUNT_REQUEST_PORT,
        auth: {
          user: process.env.MAIL_ACCOUNT_REQUEST_USER,
          pass: process.env.MAIL_ACCOUNT_REQUEST_PASS,
        },
      },
    },
  },
  metrics: {
    enabled: true,
    port: 9000,
    path: '/metrics',
    log: false,
  },
};

export default defaultConfig;
