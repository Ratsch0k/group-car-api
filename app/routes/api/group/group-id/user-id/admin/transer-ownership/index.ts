import {Router} from 'express';
import {transferOwnershipController} from './transfer-ownership-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const transferOwnershipRouter = Router({mergeParams: true});

transferOwnershipRouter.post('/', asyncWrapper(transferOwnershipController));

export default transferOwnershipRouter;
