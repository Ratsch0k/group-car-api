import express = require('express');
import path = require('path');
import cookieParser = require('cookie-parser');
import logger = require('morgan');
import errorHandler from '@app/errors/error-handler';
import expressJwt from 'express-jwt';

/**
 * Import router
 */
import statusRouter from '@app/api/status-router';
import loginRouter from '@app/auth/login/login-router';
import userRouter from '@app/users/user-router';
import signUpRouter from '@app/auth/signUp/sign-up-router';
import config from '@config';
const app: express.Application = express();

// Add middleware
app.set('trust proxy', true);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// Adding authentication routes
app.use('/auth/login', loginRouter);
app.use('/auth/sign-up', signUpRouter);

app.use('/api',
    expressJwt({
      secret: config.jwt.secret,
      getToken: config.jwt.getToken,
    }));

// Add own router

app.use('/api/test', statusRouter);
app.use('/api/user', userRouter);


/**
 * Configure serving of documentation
 */
app.use(express.static('static'));

/**
 * Configure static service
 */
app.use(express.static(config.staticPath.path));
app.get('/*', (req, res) => {
  res.sendFile(
      path.join(
          config.staticPath.path,
          'index.html'));
});

// Register error handler
app.use(errorHandler);

export default app;
