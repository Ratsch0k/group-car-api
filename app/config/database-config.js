// eslint-disable-next-line @typescript-eslint/no-var-requires
const log = require('debug')('group-car-db');
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    keepDefaultTimezone: true,
    clientMinMessages: false,
    dialect: 'postgres',
    logging: (line) => log(line),
  },
  test: {
    username: 'groupcarapitest',
    password: 'groupcarapitest',
    database: 'groupcarapitest',
    host: '127.0.0.1',
    dialect: 'postgres',
    keepDefaultTimezone: true,
    clientMinMessages: false,
    logging: false,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    keepDefaultTimezone: true,
    clientMinMessages: false,
    dialect: 'postgres',
    logging: (line) => log(line),
  },
};
