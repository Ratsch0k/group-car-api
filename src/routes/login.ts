import express = require('express');
import debug = require('debug');
debug('group-car:login');
const router: express.Router = express.Router();

/**
 * Login handler
 * @param req Http request
 * @param res Http response
 */
const loginHandler: express.RequestHandler = (req, res) => {
  if (!req.body.user || !req.body.password) {
    res.status(400).send();
  }

  debug.log('%o requested login', req.body.user);
};

/**
 * Add the loginHandler to the router
 */
router.put('/', loginHandler);

module.exports = router;
