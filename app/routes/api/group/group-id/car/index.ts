import {Router} from 'express';
import createCarRouter from './create';

const groupCarRouter = Router({mergeParams: true});

groupCarRouter.post('/', createCarRouter);

export default groupCarRouter;
export * from './create';
