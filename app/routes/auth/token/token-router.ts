import * as express from 'express';
import tokenController from './token-controller';
import debug from 'debug';

const log = debug('group-car:token');
const router: express.Router = express.Router();

const tokenLogger: express.RequestHandler = (req, res, next) => {
  log('IP %s requested login per token', req.ip);
  next();
};

/**
 * Add handler to chain.
 */
router.put('/',
    tokenLogger,
    tokenController,
);

export default router;
