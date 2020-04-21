import express = require('express');
import path = require('path');
import cookieParser = require('cookie-parser');
import logger = require('morgan');
import errorHandler from '@app/errors/error-handler';
import expressJwt from 'express-jwt';
// import csurf from 'csurf';

/**
 * Import router
 */
import statusRouter from '@app/api/status-router';
import userRouter from '@app/users/user-router';
import config from '@config';
import authRouter from '@app/auth';
import jwtCsrf from './jwt/jwt-csrf';
import {preLoginJwtValidator} from './jwt/jwt-util';

const app: express.Application = express();

// Add middleware
app.set('trust proxy', true);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use(jwtCsrf());

// Adding authentication routes
app.use('/auth', authRouter);

app.use('/api',
    expressJwt({
      secret: config.jwt.secret,
      getToken: config.jwt.getToken,
    }),
    preLoginJwtValidator);

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
