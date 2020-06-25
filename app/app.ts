import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import errorHandler from '@errors';
import expressJwt from 'express-jwt';
import morganDebug from 'morgan-debug';

/**
 * Import router
 */
import config from '@config';
import authRouter from '@app/routes/auth';
import jwtCsrf from './routes/auth/jwt/jwt-csrf';
import {preLoginJwtValidator} from './routes/auth/jwt/jwt-util';
import apiRouter from './routes/api';
import {userRouter} from './routes/user';

const app: express.Application = express();

// Add middleware
app.set('trust proxy', true);

// Only log http request if a format string is provided
if (config.morgan.formatString !== null) {
  app.use(morganDebug('group-car-http', config.morgan.formatString));
}
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use(jwtCsrf());

// Adding authentication routes
app.use('/auth', authRouter);

// Add user routers
app.use('/user', userRouter);

// Add api router
app.use(
    '/api',
    expressJwt({
      secret: config.jwt.secret,
      getToken: config.jwt.getToken,
      requestProperty: 'auth',
    }),
    preLoginJwtValidator,
    apiRouter,
);
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
