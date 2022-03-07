import {RequestHandler} from 'express';
import {BadRequestError} from '@errors';
import debug from 'debug';
import {UserService} from '@models';

const log = debug('group-car:user:settings:change-password');
const error = debug('group-car:user:settings:change-password:error');

const ChangePasswordController: RequestHandler = async (req, res, next) => {
  // Check if request body has the two required fields
  if (
    typeof req.body.oldPassword !== 'string' ||
    typeof req.body.newPassword !== 'string'
  ) {
    error('At least one parameter is missing');
    throw new BadRequestError();
  }

  const user = req.user;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  if (typeof user === 'object') {
    await UserService.changePassword(user, oldPassword, newPassword);
    res.status(204).send();
  } else {
    error('User not set on request');
    throw new BadRequestError();
  }
};

export default ChangePasswordController;
