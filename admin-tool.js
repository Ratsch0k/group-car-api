#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const dbConfigs = require('./app/config/database-config');
const {Sequelize} = require('sequelize');
const sequelize = require('sequelize');
const nodemail = require('nodemailer');

const registerUser = async (argv) => {
  if (argv.verbose) console.info(`register user: ${argv.requestId}`);

  const requestId = argv.requestId;
  const dbConfig = dbConfigs[argv.environment];

  if (argv.verbose) console.dir(dbConfig);
  const database = new Sequelize(dbConfig.database,
      dbConfig.username,
      dbConfig.password || '',
      dbConfig);

  try {
    await database.authenticate();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  if (argv.verbose) console.log('Successfully connected to database');

  let userRequest = await database.query(
      `SELECT id, username, email, password, "profilePic" FROM `+
      `"userRequests" WHERE id=${requestId}`,
      {type: sequelize.QueryTypes.SELECT},
  );

  if (userRequest.length <= 0) {
    console.error(`No request with id ${requestId} exists`);
    process.exit(1);
  } else if (userRequest.length > 1) {
    console.error(`There are multiple entries for id` +
    ` ${requestId}. This should not happen`);
    process.exit(1);
  } else {
    userRequest = userRequest[0];
  }

  // Start transaction for creating the new user
  const transaction = await database.transaction();
  if (argv.verbose) console.info('Started transaction');
  let user;
  try {
    if (argv.verbose) console.info('Insert new user');
    user = await database
        .getQueryInterface().bulkInsert('users', [{
          username: userRequest.username,
          password: userRequest.password,
          email: userRequest.email,
          isBetaUser: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }], {
          transaction,
          returning: true,
        });
    user = user[0];

    if (!user) {
      throw new Error('Could not insert user');
    }
    if (argv.verbose) console.info('User was inserted successfully');

    if (argv.verbose) console.info('Insert new profile picture');
    await database.getQueryInterface().bulkInsert('profilePics', [{
      userId: user.id,
      data: userRequest.profilePic,
    }], {
      transaction,
    });
    if (argv.verbose) {
      console.info('Profile picture was inserted successfully');
    }

    if (argv.verbose) console.info('Delete user request');
    await database.getQueryInterface().bulkDelete('userRequests',
        {id: userRequest.id}, {transaction});
    if (argv.verbose) console.info('User was deleted successfully');
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    if (argv.verbose) console.info('Transaction rolled back');
    await database.close();
    process.exit(1);
  }
  // Commit transaction
  await transaction.commit();
  if (argv.verbose) console.info('Transaction successfully committed');

  await database.close();

  console.info(`Successfully registered user with id ${requestId},` +
    ` new assigned id is ${user.id}`);

  if (!argv.withMail) {
    process.exit(0);
  }

  if (argv.verbose) console.info('Prepare sending email');
  process.exit(1);
};

const listUsers = async (argv) => {
  if (argv.verbose) console.info(`list all users`);

  const dbConfig = dbConfigs[argv.environment];

  if (argv.verbose) console.dir(dbConfig);
  const database = new Sequelize(dbConfig.database,
      dbConfig.username,
      dbConfig.password || '',
      dbConfig);

  try {
    await database.authenticate();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  if (argv.verbose) console.log('Successfully connected to database');

  const users = await database.query(
      'SELECT id, username, email FROM "userRequests"',
      {type: sequelize.QueryTypes.SELECT},
  );

  console.info(`Found ${users.length} user requests\n`);

  const longestNumber = users.map((user) => String(user.id).length)
      .reduce((prev, curr) => prev > curr ? prev : curr);
  // Print
  users.forEach((user) => {
    const currentIdLength = String(user.id).length;

    console.info(`[${' '.repeat(longestNumber - currentIdLength) +
    user.id}] Username: ` +
    `${user.username + ' '.repeat(25 - user.username.length)} ` +
    `| Email: ${user.email}`);
  });

  await database.close();
  process.exit(0);
};

require('yargs')
    .command(
        'user-request:register [requestId]',
        'Register a user', (yargs) => {
          yargs.positional(
              'requestId', {
                describe: 'The id of the user creation request',
              },
          );
          yargs.option(
              'withEmail', {
                type: 'boolean',
                describe: 'Whether or not the user should receive ' +
                'an email if he/she was successfully registered',
              },
          );
        }, registerUser)
    .command(
        'user-request:list',
        'List all user-requests',
        {}, listUsers)
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      describe: 'Run with verbose logging',
    })
    .option('environment', {
      alias: 'e',
      type: 'string',
      describe: 'The environment in which the tool should operate',
      default: 'development',
    })
    .argv;
