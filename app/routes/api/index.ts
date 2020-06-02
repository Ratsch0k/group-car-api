import express from 'express';
import userRouter from './user';
import statusController from './status-controller';
import groupRouter from './group/group-router';

const apiRouter = express.Router();

apiRouter.use('/user', userRouter);
apiRouter.use('/test', statusController);
apiRouter.use('/group', groupRouter);

export default apiRouter;
