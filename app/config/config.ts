import path from 'path';
import debug from 'debug';
import jwt from './jwt-config';

const log = debug('group-car:config');

type JWTConfig = import('./jwt-config').JWTConfig;
type SequelizeConfig = import('sequelize/types').Config;
/**
 * Get node environment.\
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
}

export interface AuthConfig {
  disableXsrfProtection: boolean;
  disableApiProtection: boolean;
}

export interface Config {
  auth: AuthConfig;
  database: DBConfig;
  bcrypt: BcryptConfig;
  staticPath: StaticPathConfig;
  error: ErrorConfig;
  jwt: JWTConfig;
  morgan: MorganConfig;
  user: UserConfig;
  serverType: string;
}

/**
 * Add database config
 */
const sequelize: SequelizeConfig = require('./database-config')[environment];

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

const auth: AuthConfig = {
  disableApiProtection: false,
  disableXsrfProtection: false,
};

let withFlush = false;

// Depending on node environment changes configs
if (environment === 'production') {
  bcrypt.saltRounds = 10;
  error.withStack = false;
  morgan.formatString = 'common';
} else if (environment === 'development') {
  auth.disableApiProtection = true;
  auth.disableXsrfProtection = true;
} else if (environment === 'test') {
  bcrypt.saltRounds = 4;
  morgan.formatString = null;
}

// Depending on server type change certain configs
if (serverType === 'development') {
  withFlush = true;
}

/**
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

const database: DBConfig = {
  sequelize,
  withFlush,
};

const user: UserConfig = {
  pb: {
    dimensions: 128,
  },
};

const config: Config = {
  auth,
  database,
  bcrypt,
  staticPath: staticPathConfig,
  error,
  jwt,
  morgan,
  user,
  serverType,
};

export default config;
