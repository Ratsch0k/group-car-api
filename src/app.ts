import express = require('express');
import path = require('path');
import cookieParser = require('cookie-parser');
import logger = require('morgan');
import debug from 'debug';
import errorHandler from 'errors/errorHandler';
const log = debug('group-car:app:log');
log('Environment: %s', process.env.NODE_ENV);

/**
 * Import router
 */
import statusRouter from 'routes/api/statusRouter';
import loginRouter from 'routes/auth/loginRouter';
import userRouter from 'routes/api/userRouter';
import signUpRouter from 'routes/auth/signUpRouter';
import database from './db';
const app: express.Application = express();

app.set('trust proxy', true);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/test', statusRouter);
app.use('/auth/login', loginRouter);
app.use('/api/user', userRouter);
app.use('/auth/signup', signUpRouter);

/**
 * Configure serving of documentation
 */
app.use(express.static('static'));

/**
 * Configure static serving and spa serving.
 * Check how the public path is supplied. If no environment is provided
 * do not serve static content.
 * Priority has directly provided environment variable "HTML_STATIC"
 */
if (process.env.npm_package_config_public || process.env.HTML_STATIC) {
  app.use(
      express.static(
          path.join(
              path.resolve(process.env.HTML_STATIC ||
                process.env.npm_package_config_public ||
                'static'))));

  app.get('/*', (req, res) => {
    res.sendFile(
        path.join(
            path.resolve(process.env.HTML_STATIC ||
                process.env.npm_package_config_public ||
                'static'),
            'index.html'));
  });
}

// Register error handler
app.use(errorHandler);


// If currently in environment sync the database
if (process.env.NODE_ENV === 'development') {
  database.sync({force: true}).then(() => {
    console.log('Sync database');
  });
}


export default app;
