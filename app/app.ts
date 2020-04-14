import express = require('express');
import path = require('path');
import cookieParser = require('cookie-parser');
import logger = require('morgan');
import debug from 'debug';
import errorHandler from '@app/errors/error-handler';
const log = debug('group-car:app:log');
log('Environment: %s', process.env.NODE_ENV);

/**
 * Import router
 */
import statusRouter from '@app/api/status-router';
import loginRouter from '@app/authentication/login/login-router';
import userRouter from '@app/users/user-router';
import signUpRouter from '@app/authentication/signUp/sign-up-router';
import database from '@db';
import config from '@config';
const app: express.Application = express();

app.set('trust proxy', true);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/test', statusRouter);
app.use('/auth/login', loginRouter);
app.use('/api', userRouter);
app.use('/auth/signup', signUpRouter);

/**
 * Configure serving of documentation
 */
app.use(express.static('static'));

/**
 * Configure static service
 */
app.use(express.static(config.staticPath.path));
app.get('/*', (req, res) =>
  res.sendFile(
      path.join(
          config.staticPath.path,
          'index.html')));

// Register error handler
app.use(errorHandler);


// If currently in environment sync the database
if (process.env.NODE_ENV === 'development') {
  database.sync({force: true}).then(() => {
    console.log('Sync database');
  });
}


export default app;