#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require('./app');
import debug = require('debug');
debug('group-car:http');
import http = require('http');

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
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 * @param val  a string which represent a port
 * @return the normalized port
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
 * @param error the thrown error
 */
function onError(error: any) {
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
    debug('Listening on ' + bind);
  }
}

module.exports = server;
