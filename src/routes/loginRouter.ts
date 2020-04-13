import express = require('express');
import debug = require('debug');
import NotImplementedError from 'src/errors/notImplementedError';
debug('group-car:login');
const router: express.Router = express.Router();

/**
 * Login router
 * @param req Http request
 * @param res Http response
 */
const loginRouter: express.RequestHandler = (req, res) => {
  if (!req.body.username || !req.body.password) {
    debug.log('Request is missing required credentials');
    res.status(400).send();
  }

  debug.log('%o requested login', req.body.username);
  res.send(new NotImplementedError(req.path));
};

/**
 * Add the {@link loginRouter} to the router
 */
router.put('/', loginRouter);

export default router;
