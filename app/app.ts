import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import errorHandler from '@errors';
import expressJwt from 'express-jwt';
import debug from 'debug';

/**
 * Import router
 */
import config from '@config';
import authRouter from '@app/auth';
import jwtCsrf from './jwt/jwt-csrf';
import {preLoginJwtValidator} from './jwt/jwt-util';
import apiRouter from './routes/api';
import {userRouter} from './routes/user';

const app: express.Application = express();
const log = debug('group-car');

// Add middleware
app.set('trust proxy', true);

// Only log http request if a format string is provided
if (config.morgan.formatString !== null) {
  app.use(morgan(config.morgan.formatString));
}
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// Add if xsrf protection if not disabled
if (!config.auth.disableXsrfProtection) {
  log('Enabled xsrf protection');
  app.use(jwtCsrf());
} else {
  log('Xsrf protection is disabled. ' +
    'Server should not be running in production');
}


// Adding authentication routes
app.use('/auth', authRouter);

// Add user routers
app.use('/user', userRouter);

// Add api protection
if (!config.auth.disableApiProtection) {
  log('Enabled api protection');
  app.use(
      '/api',
      expressJwt({
        secret: config.jwt.secret,
        getToken: config.jwt.getToken,
      }),
      preLoginJwtValidator,
  );
} else {
  log('Api protection is disabled. Server should not be running in production');
}
// Add api router
app.use('/api', apiRouter);


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
