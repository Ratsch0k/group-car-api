import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {getCarsController} from './get-cars-controller';

const getCarsRouter = Router({mergeParams: true});

getCarsRouter.use('/', asyncWrapper(getCarsController));

export default getCarsRouter;
