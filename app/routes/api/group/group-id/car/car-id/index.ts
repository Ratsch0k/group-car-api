import {carIdValidation} from '@app/validators';
import {Router} from 'express';
import driveCarRouter from './drive';

const carCarIdRouter = Router({mergeParams: true});

carCarIdRouter.use(carIdValidation);
carCarIdRouter.use('/drive', driveCarRouter);

export default carCarIdRouter;
export * from './drive';
