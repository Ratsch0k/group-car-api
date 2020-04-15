import path from 'path';
import debug from 'debug';
const log = debug('group-car:config');

type DBConfig = import('sequelize/types').Config;
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

export interface Config {
  database: DBConfig;
  bcrypt: BcryptConfig;
  staticPath: StaticPathConfig;
}

/**
 * Add database config
 */
const database: DBConfig = require('./database-config')[environment];

let bcrypt: BcryptConfig;

// Depending on node environment configure differently
if (environment === 'production') {
  bcrypt = {
    saltRounds: 10,
  };
} else if (environment === 'test') {
  bcrypt = {
    saltRounds: 4,
  };
} else {
  bcrypt = {
    saltRounds: 8,
  };
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

const config: Config = {
  database,
  bcrypt,
  staticPath: staticPathConfig,
};

export default config;
