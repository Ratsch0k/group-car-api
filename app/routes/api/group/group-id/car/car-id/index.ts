import {carIdValidation} from '@app/validators';
import {Router} from 'express';
import driveCarRouter from './drive';
import parkCarRouter from './park';

const carCarIdRouter = Router({mergeParams: true});

carCarIdRouter.use(carIdValidation);
carCarIdRouter.use('/drive', driveCarRouter);
carCarIdRouter.use('/park', parkCarRouter);

export default carCarIdRouter;
export * from './drive';
