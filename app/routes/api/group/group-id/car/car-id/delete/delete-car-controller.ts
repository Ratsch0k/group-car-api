import {RequestHandler} from 'express';
import {BadRequestError} from '@errors';
import {CarService} from '@models';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteCarController: RequestHandler = async (req, res, _next) => {
  // Check parameter
  const groupId = Number.parseInt(req.params.groupId, 10);
  const carId = Number.parseInt(req.params.carId, 10);
  const user = req.user;

  if (isNaN(groupId) || isNaN(carId) || user === undefined) {
    throw new BadRequestError('Parameters are missing');
  }

  await CarService.delete(user, groupId, carId);
};
