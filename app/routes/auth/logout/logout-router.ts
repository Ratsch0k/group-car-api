import express from 'express';
import logoutController from './logout-controller';

const logoutRouter = express.Router();

/**
 * Router for the logout route
 */
logoutRouter.put('/', logoutController);

export default logoutRouter;
