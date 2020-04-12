module.exports = {
  development: {
    username: 'group-car-api-dev',
    password: 'group-car-api-dev',
    database: 'group-car-dev',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  test: {
    username: 'group-car-api-test',
    password: null,
    database: 'group-car-test',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
  },
};
