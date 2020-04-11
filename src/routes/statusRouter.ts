import express = require('express');
const router: express.Router = express.Router();

/**
 * Status router
 * @param req Http request
 * @param res Http response
 */
const statusRouter: express.RequestHandler = (req, res) => {
  res.send({
    server: 'up',
    database: 'down',
  });
};

/**
 * Add the {@link statusRouter} to the get route
 */
router.get('/', statusRouter);

module.exports = router;
