import {Config} from './config.d';
import dbConfig from './database-config';
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
  auth: {
    saltRounds: 8,
    csrfTokenName: 'XSRF-TOKEN',
    session: {
      cookieName: 'SID',
      absoluteTimeout: 1000 * 60 * 60 * 24 * 7,
      inactivityTimeout: 1000 * 60 * 60 * 24,
      sessionPrefix: 'session',
      cookieOptions: {
        secure: false,
        sameSite: 'lax',
        httpOnly: true,
      },
    },
  },
  static: {
    path: path.resolve('./static'),
    disabled: false,
  },
  error: {
    withStack: false,
  },
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
    userPrefix: 'user',
  },
  serverType: 'release',
  group: {
    maxMembers: 25,
    maxCars: 8,
  },
  redis: {
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
    tracesSampleRate: 1.0,
    dsn: 'https://7d4cc992f614416abcb1007107e12c16@o656739.ingest.sentry.io/5763203',
  },
};

export default defaultConfig;
