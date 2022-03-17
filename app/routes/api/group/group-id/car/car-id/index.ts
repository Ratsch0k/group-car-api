import {carIdValidator} from '@app/validators';
import {Router} from 'express';
import driveCarRouter from './drive';
import parkCarRouter from './park';
import createValidationRouter from '@app/validators/create-validation-router';

const carCarIdRouter = Router({mergeParams: true});

carCarIdRouter.use(
    createValidationRouter('car:carId', carIdValidator(), 'check carId'));
carCarIdRouter.use('/drive', driveCarRouter);
carCarIdRouter.use('/park', parkCarRouter);

export default carCarIdRouter;
export * from './drive';
