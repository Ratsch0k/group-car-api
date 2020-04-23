import path from 'path';
import debug from 'debug';
import jwt from './jwt-config';
const log = debug('group-car:config');

type JWTConfig = import('./jwt-config').JWTConfig;
type SequelizeConfig = import('sequelize/types').Config;
/**
 * Get node environment.\
 * If none provided assume development.
 */
const environment = process.env.NODE_ENV || 'development';
log('Environment: %s', environment);

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

export interface Config {
  database: DBConfig;
  bcrypt: BcryptConfig;
  staticPath: StaticPathConfig;
  error: ErrorConfig;
  jwt: JWTConfig;
  morgan: MorganConfig;
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

let withFlush = true;

// Depending on node environment changes configs
if (environment === 'production') {
  bcrypt.saltRounds = 10;
  error.withStack = false;
  withFlush = false;
  morgan.formatString = 'common';
} else if (environment === 'test') {
  bcrypt.saltRounds = 4;
  morgan.formatString = null;
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

const config: Config = {
  database,
  bcrypt,
  staticPath: staticPathConfig,
  error,
  jwt,
  morgan,
};

export default config;
