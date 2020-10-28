import express from 'express';
import generatePbRouter from
  './generate-profile-pic/generate-profile-pic-validator';

export const userRouter = express.Router();

userRouter.use('/generate-profile-pic', generatePbRouter);
