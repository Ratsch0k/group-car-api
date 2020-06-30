import path from 'path';
import debug from 'debug';
import jwt from './jwt-config';
import dbConfig from './database-config';
import {JWTConfig} from './jwt-config';
import {Config as SequelizeConfig} from 'sequelize/types';

const log = debug('group-car:config');

/**
 * Get node environment.
 *
 * If none provided, assume development.
 */
const environment = process.env.NODE_ENV || 'development';
log('Environment: %s', environment);

/**
 * For which type of server this server is used:
 *  - development:  The development server
 *  - beta:         The beta server
 *  - release:      The release server, main server
 */
const serverType = process.env.SERVER_TYPE || 'development';
log('Server: %s', serverType);

export interface BcryptConfig {
  saltRounds: number;
}

export interface StaticPathConfig {
  path: string;
}

export interface ErrorConfig {
  withStack: boolean;
}

export interface DBConfig {
  sequelize: SequelizeConfig;
  withFlush: boolean;
}

export interface MorganConfig {
  formatString: string | null;
}

export interface PbConfig {
  dimensions: number;
}

export interface UserConfig {
  pb: PbConfig;
  signUpThroughRequest: boolean;
}

export interface GroupConfig {
  maxMembers: number;
}

export interface MailConfig {
  accountRequest: {
    type?: string;
    options: {
      service?: string;
      host?: string;
      port?: string;
      auth?: {
        user?: string;
        pass?: string;
      };
    }
    receiver?: string;
  }
}

export interface Config {
  database: DBConfig;
  bcrypt: BcryptConfig;
  staticPath: StaticPathConfig;
  error: ErrorConfig;
  jwt: JWTConfig;
  morgan: MorganConfig;
  user: UserConfig;
  serverType: string;
  group: GroupConfig;
  mail: MailConfig;
}

/**
 * Add database config
 */
const sequelize: SequelizeConfig =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dbConfig as any)[environment];

/**
 * Initialize BcryptConfig with default value.
 */
const bcrypt: BcryptConfig = {
  saltRounds: 8,
};
/**
 * Initialize ErrorConfig with default value
 */
const error: ErrorConfig = {
  withStack: true,
};

const morgan: MorganConfig = {
  formatString: 'dev',
};


let withFlush = false;

// Depending on node environment changes configs
if (environment === 'production') {
  bcrypt.saltRounds = 10;
  error.withStack = false;
  morgan.formatString = 'common';
} else if (environment === 'test') {
  bcrypt.saltRounds = 4;
  morgan.formatString = null;
}

// Depending on server type change certain configs
if (serverType === 'development') {
  withFlush = true;
}

/*
 * Set the path for serving static files depending on
 * which environment variable is provided.
 * Priority:
 * - HTML_STATIC
 * - npm_package_config_public (`config.public` in `package.json`)
 * - `'static'`
 */

let pathToStatic: string;
try {
  if (process.env.HTML_STATIC) {
    pathToStatic = path.resolve(process.env.HTML_STATIC);
  } else if (process.env.npm_package_config_public) {
    pathToStatic = path.resolve(process.env.npm_package_config_public);
  } else {
    pathToStatic = 'static';
  }
} catch (err) {
  pathToStatic = 'static';
}
const staticPathConfig: StaticPathConfig = {
  path: pathToStatic,
};

// Get the mail config from environment variables
const mail: MailConfig = {
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
};

const database: DBConfig = {
  sequelize,
  withFlush,
};

const user: UserConfig = {
  pb: {
    dimensions: 128,
  },
  signUpThroughRequest: environment === 'test' ?
    false :
    process.env.DISABLE_SIGN_UP_THROUGH_REQUEST === undefined ?
    true :
    !Boolean(process.env.DISABLE_SIGN_UP_THROUGH_REQUEST),
};

const group: GroupConfig = {
  maxMembers: 25,
};

const config: Config = {
  database,
  bcrypt,
  staticPath: staticPathConfig,
  error,
  jwt,
  morgan,
  user,
  serverType,
  group,
  mail,
};

export default config;
