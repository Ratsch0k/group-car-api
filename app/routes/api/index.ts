import express from 'express';
import userRouter from './user';
import groupRouter from './group/group-router';

const apiRouter = express.Router();

apiRouter.use('/user', userRouter);
apiRouter.use('/group', groupRouter);

export default apiRouter;
