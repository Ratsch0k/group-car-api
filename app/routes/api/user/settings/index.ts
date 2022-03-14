import {Router} from 'express';
import changePasswordRouter from './change-password';

const settingsRouter = Router();

settingsRouter.use('/change-password', changePasswordRouter);

export default settingsRouter;
