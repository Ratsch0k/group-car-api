import {Router} from 'express';
import csrfController from './csrf-controller';

const csrfRouter = Router().head('/', csrfController);

export default csrfRouter;
