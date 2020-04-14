type DBConfig = import('sequelize/types').Config;
/**
 * Get node environment.\
 * If none provided assume development.
 */
const environment = process.env.NODE_ENV || 'development';

export interface BcryptConfig {
  saltRounds: number;
}

export interface Config {
  database: DBConfig;
  bcrypt: BcryptConfig;
}

/**
 * Add database config
 */
const database: DBConfig = require('./database-config')[environment];

let bcrypt: BcryptConfig;
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

const config: Config = {
  database,
  bcrypt,
};

export default config;
