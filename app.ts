import express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

/**
 * Import router
 */
const testRouter = require('./routes/test');
const loginRouter = require('./routes/login');


const app: express.Application = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/test', testRouter);
app.use('/api/login', loginRouter);

/**
 * Configure static serving and spa serving
 */
app.use(
    express.static(
        path.join(
            path.resolve(process.env.npm_package_config_public) ||
            path.resolve(process.env.PUBLIC) ||
            __dirname)));

app.get('/*', (req, res) => {
  res.sendFile(
      path.join(
          path.resolve(process.env.npm_package_config_public) ||
          path.resolve(process.env.PUBLIC) ||
          __dirname,
          'index.html'));
});

module.exports = app;
