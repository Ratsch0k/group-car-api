import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {createCarController} from './create-car-controller';
import createCarValidationRouter from './create-car-validator';

const createCarRouter = Router({mergeParams: true});

createCarRouter.use(
    '/',
    createCarValidationRouter,
    asyncWrapper(createCarController),
);

export default createCarRouter;
export * from './create-car-controller';
