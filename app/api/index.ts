import express from 'express';
import userRouter from './user';
import statusRouter from './status-controller';

const apiRouter = express.Router();

apiRouter.use('/user', userRouter);
apiRouter.use('/test', statusRouter);

export default apiRouter;
