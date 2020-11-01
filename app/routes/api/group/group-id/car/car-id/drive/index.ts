import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {driveCarController} from './drive-car-controller';

const driveCarRouter = Router({mergeParams: true});

driveCarRouter.put('/', asyncWrapper(driveCarController));

export default driveCarRouter;
export * from './drive-car-controller';
