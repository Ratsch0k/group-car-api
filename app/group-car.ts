#!/usr/bin/env node

/**
 * Module dependencies.
 */

import debug from 'debug';
import {argv} from 'yargs';

/*
 * Check if provided command line arguments are all correct and
 * if not, stop executing and show error message
 */
const allowedArgs = ['flush', 'allowSignUp', 'disableStaticServe'];
const argsCorrect = Object.keys(argv).every((arg) => {
  if (arg === '_' || arg === '$0') {
    return true;
  } else {
    return allowedArgs.includes(arg);
  }
});

if (!argsCorrect) {
  let message = 'At least one incorrect command line ' +
    'argument provided!\nAllowed are:\n';
  allowedArgs.forEach((arg) => {
    message += `\t- ${arg}\n`;
  });

  console.error(message);
  process.exit(1);
}

import http = require('http');
import app from './app';
import db from '@db';

const log = debug('group-car:http');
const error = debug('group-car:http:error');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.npm_package_config_port ||
  process.env.PORT ||
  '8080');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Set up socket.io
 */
import initSocketIoServer from './socket';
initSocketIoServer(server);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 * @param val - a string which represent a port
 * @returns the normalized port
 */
function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 * @param error - the thrown error
 */
function onError(error: Record<string, unknown>) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  if (addr !== null) {
    const bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
    log('Listening on ' + bind);
  }

  db.isAvailable().then((avail: boolean) => {
    if (avail) {
      log('Database is available');
    } else {
      error('Database is not available');
    }
  });
}

module.exports = server;
