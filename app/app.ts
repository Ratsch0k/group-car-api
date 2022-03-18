import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import errorHandler from '@errors';
import expressJwt from 'express-jwt';
import morganDebug from 'morgan-debug';
import {obfuscateMetrics} from '@util/obfuscateMetrics';
import debug from 'debug';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

// Inject custom checks for **express-validator**.
// See `validators/inject-custom-checks.ts` for more details.
import {injectCustomChecks} from '@app/validators';
injectCustomChecks();

/**
 * Import router
 */
import config from '@config';
import authRouter from '@app/routes/auth';
import jwtCsrf from './routes/auth/jwt/jwt-csrf';
import {postLoginJwtValidator} from '@routes/auth/jwt/jwt-util';
import apiRouter from './routes/api';
import {userRouter} from '@routes/user';

const log = debug('group-car:app');

const app: express.Application = express();

// Add middleware
app.set('trust proxy', true);

const nonTracablePaths = [
  '/swagger-stats/metrics',
];
/**
 * Initialise sentry. Don't if testing
 */
if (process.env.NODE_ENV !== 'test') {
  log('Sentry monitoring with dsn %s', config.metrics.dsn);
  Sentry.init({
    dsn: config.metrics.dsn,
    integrations: [
      new Sentry.Integrations.Http({tracing: true}),
      new Tracing.Integrations.Express({app}),
    ],
    tracesSampleRate: config.metrics.tracesSampleRate,
  });

  const tracingHandler = Sentry.Handlers.tracingHandler();
  app.use(Sentry.Handlers.requestHandler());
  app.use((req, res, next) => {
    // Filter out paths which should not be traced

    if (!nonTracablePaths.includes(req.path)) {
      tracingHandler(req, res, next);
    } else {
      next();
    }
  });
}


// Only log http request if a format string is provided
if (config.morgan.formatString !== null) {
  app.use(morganDebug(
      'group-car-http',
      config.morgan.formatString,
      {
        skip: (req: express.Request) =>
          nonTracablePaths.includes(req.path),
      },
  ));
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
