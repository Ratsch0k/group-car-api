import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {parkCarController} from './park-car-controller';
import parkCarValidationRouter from './park-car-validator';

const parkCarRouter = Router({mergeParams: true});

parkCarRouter.put(
    '/',
    parkCarValidationRouter,
    asyncWrapper(parkCarController),
);

export default parkCarRouter;
export * from './park-car-controller';
