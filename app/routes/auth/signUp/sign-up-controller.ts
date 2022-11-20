import {BadRequestError} from '@errors';
import {Router, RequestHandler} from 'express';
import {AuthenticationService} from '@app/auth';
import {asyncWrapper} from '@app/util/async-wrapper';

/**
 * Signs the user up.
 *
 * Creates a new user with the given properties.
 * @param req  - Http request, information about user in `req.body`
 * @param res  - Http response
 * @param _next - The next request handler
 */
export const signUpController: RequestHandler = async (req, res, _next) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const offset = parseInt(req.body.offset || '0', 10);

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof offset !== 'number' || isNaN(offset)
  ) {
    throw new BadRequestError('Incorrect arguments');
  }

  const user = await AuthenticationService.signUp(
      username,
      email,
      password,
      offset,
      {ip: req.ip},
  );

  await req.createSession(user);

  res.status(201).send(user);
};

const signUpRouter = Router().use(
    '',
    asyncWrapper(signUpController),
);

export default signUpRouter;

