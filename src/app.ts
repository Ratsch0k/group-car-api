import express = require('express');
import path = require('path');
import cookieParser = require('cookie-parser');
import logger = require('morgan');
import debug from 'debug';
const log = debug('group-car:app:log');
log('Environment: %s', process.env.NODE_ENV);

/**
 * Import router
 */
import statusRouter from 'routes/statusRouter';
import loginRouter from 'routes/loginRouter';
import userRouter from 'routes/userRouter';

const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/test', statusRouter);
app.use('/api/login', loginRouter);
app.use('/api/user', userRouter);

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


export default app;
