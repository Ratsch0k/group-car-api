import express from 'express';
import generatePbRouter from
  './generate-profile-pic/generate-profile-pic-router';

export const userRouter = express.Router();

userRouter.use('/generate-profile-pic', generatePbRouter);

export {default} from './user';
export {default as UserDto} from './user-dto';
export {default as ProfilePic} from './profile-pic';
