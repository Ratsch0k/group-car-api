import express from 'express';
import userRouter from './user-router';

const router = express.Router();

router.use('/', userRouter);

export default router;
