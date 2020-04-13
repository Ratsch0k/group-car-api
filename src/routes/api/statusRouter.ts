import express from 'express';
const router: express.Router = express.Router();
import database from 'db';

export type state = 'up' | 'down';
export interface Status {
  server: state;
  database: state;
}

/**
 * Status router
 * @param req Http request
 * @param res Http response
 */
const statusRouter: express.RequestHandler = (req, res) => {
  database.isAvailable().then((avail: boolean) => {
    const status: Status = {
      server: 'up',
      database: avail ? 'up' : 'down',
    };

    res.send(status);
  });
};

/**
 * Add the {@link statusRouter} to the get route
 */
router.get('/', statusRouter);

export default router;
