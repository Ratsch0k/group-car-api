// eslint-disable-next-line @typescript-eslint/no-var-requires
const log = require('debug')('group-car-db');
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    logging: (line) => log(line),
  },
  test: {
    username: 'groupcarapitest',
    password: 'groupcarapitest',
    database: 'groupcartest',
    host: '127.0.0.1',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    logging: (line) => log(line),
  },
};
