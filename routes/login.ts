import express = require('express');
import debug = require('debug');
debug('group-car:login');
const router: express.Router = express.Router();

router.put('/', (req, res, next) => {
  if (!req.body.user || !req.body.password) {
    res.status(400).send();
  }

  debug.log('%o requested login', req.body.user);
});

module.exports = router;
