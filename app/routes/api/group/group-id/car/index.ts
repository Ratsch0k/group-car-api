import {Router} from 'express';
import carCarIdRouter from './car-id';
import createCarRouter from './create';
import getCarsRouter from './get';

const groupCarRouter = Router({mergeParams: true});

groupCarRouter.post('/', createCarRouter);
groupCarRouter.get('/', getCarsRouter);
groupCarRouter.use('/:carId', carCarIdRouter);

export default groupCarRouter;
export * from './create';
export * from './get';
export * from './car-id';
