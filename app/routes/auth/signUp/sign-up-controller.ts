import debug from 'debug';
import {User, UserDto, ProfilePic, UserRequest} from '@models';
import ModelToDtoConverter from '@util/model-to-dto-converter';
import {UsernameAlreadyExistsError} from '@errors';
import {UniqueConstraintError} from 'sequelize';
import {convertUserToJwtPayload} from '@app/routes/auth/jwt/jwt-util';
import generatePic from '@util/generate-profile-pic';
import config from '@config';
import {Router, RequestHandler} from 'express';
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars-plaintext-inline-ccs';
import exhbs from 'express-handlebars';
import {Options} from 'nodemailer/lib/sendmail-transport';

/**
 * Log method for normal debug logging
 */
const log = debug('group-car:sign-up:controller:log');
/**
 * Log method for error logging
 */
const error = debug('group-car:sign-up:controller:error');

const picDim = config.user.pb.dimensions;

/**
 * This controller decides if the request should be handled by
 * {@link signUpUserRequestHandler} or {@link signUpController}.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const signUpSwitchController: RequestHandler = (req, res, next) => {
  /*
   * Depending on the mode, either forward arguments
   * to signUpUserRequestHandler
   * or signUpController
   */
  if (config.user.signUpThroughRequest) {
    // Check if a user with that username already exists
    signUpUserRequestHandler(req, res, next);
  } else {
    signUpController(req, res, next);
  }
};

/**
 * Handles the sign up request if the server
 * doesn't allow direct user creation.
 * Instead this handler will create a {@link UserRequest}
 * and send an email to the configured receiver.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const signUpUserRequestHandler: RequestHandler = (req, res, next) => {
  User.findByUsername(req.body.username).then((user) => {
    if (user === null) {
      return generatePic(picDim, req.body.username, req.body.offset ?? 0);
    } else {
      throw new UsernameAlreadyExistsError(req.body.username);
    }
  }).then((data: Buffer) => {
    // Store request
    return UserRequest.create({
      username: req.body.username,
      password: req.body.password,
      profilePic: data,
      email: req.body.email,
    });
  }).then((userRequest) => {
    const transporter = nodemailer.createTransport(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.mail.accountRequest?.options as any);

    transporter.use('compile', hbs({
      viewEngine: exhbs.create({
        layoutsDir: 'app/views/layouts',
        partialsDir: 'app/views/partials',
      }),
      templatesDir: 'app/views',
      plaintextOptions: {
        uppercaseHeadings: false,
      },
      viewPath: 'app/views',
    }));

    return transporter.sendMail({
      from: '"my-group-car.de" <mygroupcar@gmail.com',
      to: config.mail.accountRequest?.receiver,
      subject: `Account creation request for ${req.body.username}`,
      template: 'request-email',
      context: {
        id: userRequest.id,
        username: userRequest.username,
        timestamp: new Date().toLocaleString(),
        serverType: process.env.SERVER_TYPE,
      },
    } as unknown as Options);
  }).then(() => {
    res.status(202)
        .send({message: 'Request was sent successfully. ' +
          'You will be notified if the request was accepted'});
  }).catch(next);
};

/**
 * Signs the user up.
 *
 * Creates a new user with the given properties.
 * @param req  - Http request, information about user in `req.body`
 * @param res  - Http response
 * @param next - The next request handler
 */
export const signUpController: RequestHandler = (req, res, next) => {
  log('Create new user for "%s"', req.body.username);
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  }).then((user) => {
    generatePic(picDim, req.body.username, req.body.offset ?? 0)
        .then((data: Buffer) => {
          return ProfilePic.create({
            data: data,
            userId: user.id,
          });
        }).then(() => {
          log('User "%s" successfully created', req.body.username);
          res.setJwtToken(convertUserToJwtPayload(user), user.username);
          res.status(201).send(ModelToDtoConverter
              .convert<UserDto>(user.get({plain: true}), UserDto));
        });
  }).catch((err) => {
    // Handle unique constraints error differently
    if (err instanceof UniqueConstraintError) {
      error('Couldn\'t create user "%s", because username already exists',
          req.body.username);
      next(new UsernameAlreadyExistsError(req.body.username));
    } else {
      error('Couldn\'t create user "%s"', req.body.username);
      next(err);
    }
  });
};

const signUpRouter = Router().use(
    '',
    signUpSwitchController,
);

export default signUpRouter;

