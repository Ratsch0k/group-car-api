import {Router} from 'express';
import createCarRouter from './create';
import getCarsRouter from './get';

const groupCarRouter = Router({mergeParams: true});

groupCarRouter.post('/', createCarRouter);
groupCarRouter.get('/', getCarsRouter);

export default groupCarRouter;
export * from './create';
export * from './get';
