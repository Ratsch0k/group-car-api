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
import db from '@db';

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
export const signUpSwitchController: RequestHandler = async (
  req,
  res,
  next,
) => {
  /*
   * Depending on the mode, either forward arguments
   * to signUpUserRequestHandler
   * or signUpController
   */
  if (config.user.signUpThroughRequest) {
    // Check if a user with that username already exists
    await signUpUserRequestHandler(req, res, next);
  } else {
    await signUpController(req, res, next);
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
export const signUpUserRequestHandler: RequestHandler = async (
  req,
  res,
  next,
) => {
  const user = await User.findByUsername(req.body.username);

  let profilePictureBuffer: Buffer;
  if (user === null) {
    profilePictureBuffer = await generatePic(
        picDim,
        req.body.username,
        req.body.offset ?? 0,
    );
  } else {
    throw new UsernameAlreadyExistsError(req.body.username);
  }

  // Store request
  const userRequest = await UserRequest.create({
    username: req.body.username,
    password: req.body.password,
    profilePic: profilePictureBuffer,
    email: req.body.email,
  });

  // Send email to admin
  try {
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

    await transporter.sendMail({
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
  } catch (e) {
    // Only report error.
    // The actual request was done, just sending the email failed.
    error('Could not send the email: %s', e);
  }

  res.status(202)
      .send({message: 'Request was sent successfully. ' +
        'You will be notified if the request was accepted'});
};

/**
 * Signs the user up.
 *
 * Creates a new user with the given properties.
 * @param req  - Http request, information about user in `req.body`
 * @param res  - Http response
 * @param _next - The next request handler
 */
export const signUpController: RequestHandler = async (req, res, _next) => {
  const transaction = await db.transaction();
  log('Create new user for "%s"', req.body.username);
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    }, {transaction});

    const profilePictureBuffer = await generatePic(
        picDim,
        req.body.username,
        req.body.offset ?? 0,
    );
    await ProfilePic.create({
      data: profilePictureBuffer,
      userId: user.id,
    }, {transaction});

    // If everything executing successfully, commit transaction
    transaction.commit();

    log('User "%s" successfully created', req.body.username);
    res.setJwtToken(convertUserToJwtPayload(user), user.username);
    res.status(201).send(ModelToDtoConverter
        .convert<UserDto>(user.get({plain: true}), UserDto));
  } catch (err) {
    // Handle unique constraints error differently
    if (err instanceof UniqueConstraintError) {
      error('Couldn\'t create user "%s", because username already exists',
          req.body.username);
      throw new UsernameAlreadyExistsError(req.body.username);
    } else {
      // Rethrow
      error('Couldn\'t create user "%s"', req.body.username);
      throw err;
    }
  }
};

const signUpRouter = Router().use(
    '',
    signUpSwitchController,
);

export default signUpRouter;

