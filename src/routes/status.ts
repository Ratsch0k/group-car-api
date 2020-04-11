import express = require('express');
const router: express.Router = express.Router();

/**
 * Status handler
 * @param req Http request
 * @param res Http response
 */
const statusHandler: express.RequestHandler = (req, res) => {
  res.send({
    server: 'up',
    database: 'down',
  });
};

/**
 * Add the statusHandler to the get route
 */
router.get('/', statusHandler);

module.exports = router;
