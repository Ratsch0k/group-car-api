import {Router} from 'express';
import {getGroupsController} from './get-groups-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const getGroupsRouter = Router();
getGroupsRouter.use(asyncWrapper(getGroupsController));

export default getGroupsRouter;
export * from './get-groups-controller';
