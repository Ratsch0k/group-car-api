import express from 'express';
import generatePbRouter from './generate-pb/generate-pb-router';

export const userRouter = express.Router();

userRouter.use('/generate-pb', generatePbRouter);

export {default} from './user';
export {default as UserDto} from './user-dto';
