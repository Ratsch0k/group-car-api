import express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

/**
 * Import router
 */
const statusRouter = require('./routes/status');
const loginRouter = require('./routes/login');


const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/test', statusRouter);
app.use('/api/login', loginRouter);

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
                process.env.npm_package_config_public))));

  app.get('/*', (req, res) => {
    res.sendFile(
        path.join(
            path.resolve(process.env.HTML_STATIC ||
                process.env.npm_package_config_public),
            'index.html'));
  });
}


module.exports = app;
