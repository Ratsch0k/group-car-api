import {Router} from 'express';
import {asyncWrapper} from '@util/async-wrapper';
import {deleteCarController} from './delete-car-controller';

const deleteCarRouter = Router({mergeParams: true});

deleteCarRouter.delete(
    '/',
    asyncWrapper(deleteCarController),
);

export default deleteCarRouter;
