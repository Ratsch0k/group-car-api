import {Router} from 'express';
import {searchUserController} from './search-user';
import searchUserValidationRouter from './search-user-validator';
import {asyncWrapper} from '@app/util/async-wrapper';

const searchUserRouter = Router();

searchUserRouter.get(
    '/',
    searchUserValidationRouter,
    asyncWrapper(searchUserController),
);

export default searchUserRouter;
