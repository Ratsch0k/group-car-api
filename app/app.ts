import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import errorHandler from '@errors';
import expressJwt from 'express-jwt';
import morganDebug from 'morgan-debug';
import {obfuscateMetrics} from './util/obfuscateMetrics';
import debug from 'debug';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

/**
 * Import router
 */
import config from '@config';
import authRouter from '@app/routes/auth';
import jwtCsrf from './routes/auth/jwt/jwt-csrf';
import {postLoginJwtValidator} from './routes/auth/jwt/jwt-util';
import apiRouter from './routes/api';
import {userRouter} from './routes/user';

const log = debug('group-car:app');

const app: express.Application = express();

// Add middleware
app.set('trust proxy', true);


Sentry.init({
  dsn: 'https://7d4cc992f614416abcb1007107e12c16@o656739.ingest.sentry.io/5763203',
  integrations: [
    new Sentry.Integrations.Http({tracing: true}),
    new Tracing.Integrations.Express({app}),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Only log http request if a format string is provided
if (config.morgan.formatString !== null) {
  app.use(morganDebug('group-car-http', config.morgan.formatString));
}
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use(jwtCsrf());


import swaggerStats from 'swagger-stats';
import fs from 'fs';
import yaml from 'js-yaml';

/*
 * If metrics enabled, configure middleware
 */
if (config.metrics.enabled) {
  try {
    log('Metrics enabled');
    const fileContents = fs.readFileSync(
        'static/doc/openapi/openapi.yaml', 'utf-8');
    const spec = yaml.load(fileContents) as Record<string, unknown>;
    app.use(swaggerStats.getMiddleware({
      swaggerSpec: spec,
      onResponseFinish: obfuscateMetrics,
    }));
    log('Metrics initialised');
  } catch (e) {
    log('Could not initialise metrics: %s', e.message);
  }
}


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
      algorithms: ['HS512'],
    }),
    postLoginJwtValidator,
    apiRouter,
);

/**
 * Configure serving of documentation
 */
app.use(express.static('static'));

/**
 * Configure static service
 */
if (!config.static.disabled) {
  app.use(express.static(config.static.path));
  app.get('/*', (_req, res) => {
    res.sendFile(
        path.join(
            config.static.path,
            'index.html'));
  });
}

app.use(Sentry.Handlers.errorHandler());

// Register error handler
app.use(errorHandler);

export default app;
