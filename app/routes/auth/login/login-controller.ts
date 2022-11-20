import debug from 'debug';
import {BadRequestError} from '@errors';
import {RequestHandler} from 'express';
import {AuthenticationService} from '@app/auth';

const log = debug('group-car:login:controller:log');
const error = debug('group-car:login:controller:error');

/**
 * Login controller
 * @param username - Username of the login request
 * @param password - Password of the login request
 * @returns Whether or not the login was successful
 */
const loginController: RequestHandler = async (req, res, next) => {
  log('Log in request from %s', req.ip);
  const username = req.body.username;
  const password = req.body.password;

  if (typeof username !== 'string' || typeof password !== 'string') {
    error('Invalid request from %s', req.ip);
    throw new BadRequestError('Incorrect parameters');
  }

  const user = await AuthenticationService.login(
      username, password, {ip: req.ip});

  await req.createSession(user);

  res.send(user);
};

export default loginController;
