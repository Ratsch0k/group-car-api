module.exports = {
  development: {
    username: 'group-car-api-dev',
    password: 'group-car-api-dev',
    database: 'group-car-dev',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  test: {
    username: 'groupCarApiTest',
    password: 'groupCarApiTest',
    database: 'groupCarTest',
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
