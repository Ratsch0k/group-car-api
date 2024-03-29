import path from 'path';
import debug from 'debug';
import {argv} from 'yargs';
import {
  AuthConfig,
  DBConfig,
  ErrorConfig,
  MorganConfig,
  StaticConfig,
  UserConfig,
  Config,
  MetricsConfig,
} from './config.d';
import _ from 'lodash';
import defaultConfig from './defaultConfig';
import {DeepPartial} from 'tsdef';

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

/**
 * Initialize BcryptConfig with default value.
 */
const auth: AuthConfig = {
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

// Depending on node environment changes configs
if (environment === 'production') {
  auth.saltRounds = 10;
  error.withStack = false;
  morgan.formatString = 'common';
} else if (environment === 'test') {
  auth.saltRounds = 4;
  morgan.formatString = null;
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
const staticConfig: StaticConfig = {
  path: pathToStatic,
  disabled: argv.disableStaticServe ? true : false,
};


const database: Partial<DBConfig> = {
  withFlush: environment === 'test' ? true : Boolean(argv.flush),
};

const user: Partial<UserConfig> = {
  signUpThroughRequest: environment === 'test' ?
    false :
    argv.allowSignUp ?
    false :
    process.env.DISABLE_SIGN_UP_THROUGH_REQUEST === undefined ?
    true :
    !Boolean(process.env.DISABLE_SIGN_UP_THROUGH_REQUEST),
};

const metrics: Partial<MetricsConfig> = {
  enabled: environment !== 'test',
  dsn: process.env.SENTRY_DSN || 'https://7d4cc992f614416abcb1007107e12c16@o656739.ingest.sentry.io/5763203',
};

const config: DeepPartial<Config> = {
  user,
  database,
  static: staticConfig,
  auth,
  morgan,
  error,
  metrics,
};

export default _.merge(defaultConfig, config);
