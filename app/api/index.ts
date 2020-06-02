import express from 'express';
import userRouter from './user';
import statusController from './status-controller';

const apiRouter = express.Router();

apiRouter.use('/user', userRouter);
apiRouter.use('/test', statusController);

export default apiRouter;
