#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
require('yargs')
    .command(
        'user-request:register [requestId]',
        'Register a user', (yargs) => {
          yargs.positional(
              'requestId', {
                describe: 'The id of the user creation request',
              },
          );
        }, (argv) => {
          if (argv.verbose) console.info(`register user: ${argv.requestId}`);
        })
    .command(
        'user-request:list',
        'List all user-requests',
        {},
        (argv) => {
          if (argv.verbose) console.info(`list all users`);
        })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      describe: 'Run with verbose logging',
    })
    .option('port', {
      alias: 'p',
      type: 'number',
      describe: 'The local port to which all requests should be sent',
      default: 9090,
    })
    .argv;
