import {Router} from 'express';
import {kickUserController} from './kick-user-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const kickUserRouter = Router({mergeParams: true});

kickUserRouter.post('/', asyncWrapper(kickUserController));

export default kickUserRouter;
export * from './kick-user-controller';
