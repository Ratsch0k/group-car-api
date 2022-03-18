import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {createCarController} from './create-car-controller';
import {
  createValidationRouter,
} from '@app/validators';
import {body} from 'express-validator';

const createCarRouter = Router({mergeParams: true});

createCarRouter.use(
    '/',
    createValidationRouter(
        'group:car:create',
        [
          body('color').exists().withMessage('color is missing').isCarColor(),
          body('name').exists().withMessage('name is missing').isCarName(),
        ],
        'create car',
    ),
    asyncWrapper(createCarController),
);

export default createCarRouter;
export * from './create-car-controller';
