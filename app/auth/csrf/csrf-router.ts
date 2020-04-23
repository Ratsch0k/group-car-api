import * as express from 'express';

const router = express.Router();

/**
 * Sets the XSRF-TOKEN header to the head request
 */
router.head('/', (req, res, next) => {
  res.set('XSRF-TOKEN', req.getCsrfToken!());
  next();
});

export default router;
