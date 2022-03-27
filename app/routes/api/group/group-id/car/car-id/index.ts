import {createValidationRouter} from '@app/validators';
import {Router} from 'express';
import driveCarRouter from './drive';
import parkCarRouter from './park';
import {param} from 'express-validator';
import deleteCarRouter from './delete';

const carCarIdRouter = Router({mergeParams: true});

carCarIdRouter.use(
    createValidationRouter(
        'car:carId',
        param('carId')
            .exists().withMessage('carId is missing')
            .isNumeric().withMessage('carId has to be a number'),
        'check carId',
    ),
);
carCarIdRouter.delete('/', deleteCarRouter);
carCarIdRouter.use('/drive', driveCarRouter);
carCarIdRouter.use('/park', parkCarRouter);

export default carCarIdRouter;
export * from './drive';
