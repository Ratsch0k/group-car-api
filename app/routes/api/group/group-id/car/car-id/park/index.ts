import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {parkCarController} from './park-car-controller';
import {
  createValidationRouter,
} from '@app/validators';
import {body} from 'express-validator';

const parkCarRouter = Router({mergeParams: true});

parkCarRouter.put(
    '/',
    createValidationRouter(
        'car:park',
        [
          body('latitude').exists().withMessage('latitude is missing')
              .isLatitude(),
          body('longitude').exists().withMessage('longitude is missing')
              .isLongitude(),
        ],
        'check location',
    ),
    asyncWrapper(parkCarController),
);

export default parkCarRouter;
export * from './park-car-controller';
