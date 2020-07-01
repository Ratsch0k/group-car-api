import debug from 'debug';
import {User, UserDto} from '@models';
import {UnauthorizedError} from '@errors';
import ModelToDtoConverter from '@util/model-to-dto-converter';
import {RequestHandler} from 'express';

/**
 * Log method for normal debug logging
 */
const log = debug('group-car:token:controller:log');
/**
 * Log method for error logging
 */
const error = debug('group-car:token:controller:error');

/**
 * Check if the a user with the username in the jwt still
 * exists and if the user does exist respond with ok, if not
 * respond with `Unauthorized`. This route let's the frontend check
 * if it's still logged in. Or if for example the token expired.
 * @param req  - Http request, expects payload of jwt to be in `req.user`
 * @param res  - Http response
 * @param next - The next request handler
 */
const tokenController: RequestHandler = (req, res, next) => {
  const username = req.user?.username;

  if (username !== undefined) {
    User.findByUsername(username)
        .then((user: User | null) => {
          if (user === null || user.deletedAt !== null) {
            error('%s in jwt of IP %s doesn\'t exist', username, req.ip);
            next(new UnauthorizedError());
          } else {
            log('IP %s is logged in', req.ip);
            res.status(200).send(
                ModelToDtoConverter.convert<UserDto>(
                    user.get({plain: true}),
                    UserDto,
                ),
            );
          }
        });
  } else {
    throw new UnauthorizedError();
  }
};

export default tokenController;
