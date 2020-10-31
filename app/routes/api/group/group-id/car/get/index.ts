import {Router} from 'express';
import {getCarsController} from './get-cars-controller';

const getCarsRouter = Router({mergeParams: true});

getCarsRouter.use('/', getCarsController);

export default getCarsRouter;
