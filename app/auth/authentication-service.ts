import {ProfilePic, User, UserDto, UserRepository, UserService} from '@models';
import {
  EmailAddressAlreadyUsedError,
  IncorrectPasswordError,
  UsernameAlreadyExistsError,
  UserNotFoundError,
} from '@errors';
import {debug} from 'debug';
import bindToLog from '@util/user-bound-logging';
import {ServiceContext} from '@models/service';
import ModelToDtoConverter from '@util/model-to-dto-converter';
import db from '@db';
import {Transaction} from 'typings';
import generateProfilePic from '@app/util/generate-profile-pic';
import config from '@app/config';
import {isTransaction} from '@app/util/is-transaction';


const log = debug('group-car:auth');
const error = debug('group-car:auth:error');

/**
 * Authentication service.
 */
export class AuthenticationService {
  /**
   * Tries to log in the user with the given username and password.
   *
   * First, check if a user with the given username exists.
   * Then, check if the given password matches the password of the user.
   * Lastly, return the dto version of the user model.
   *
   * If any step fails, immediately return null.
   * @param username - Username
   * @param password - Password
   * @param ip - IP of the request (from context)
   */
  public static async login(
      username: string,
      password: string,
      {ip}: ServiceContext,
  ): Promise<UserDto> {
    const ipLog = bindToLog(log, {prefix: 'IP %s: ', args: [ip]});
    const ipError = bindToLog(error, {prefix: 'IP %s: ', args: [ip]});

    // Check if user exists
    let user: User;
    try {
      ipLog('Checking if user with username exists');
      user = await UserRepository.findByUsername(username);
    } catch (e) {
      if (e instanceof UserNotFoundError) {
        ipError('User with username "%s" doesn\'t exist', username);
        throw e;
      } else {
        ipError(
            'Unexpected error occurred while searching ' +
            'for user with username "%s": %s',
            username,
            e,
        );
        // Rethrow
        throw e;
      }
    }

    // Validate password
    const passwordIsCorrect = await UserService.checkPassword(
        user.password,
        password,
    );

    if (passwordIsCorrect) {
      return ModelToDtoConverter.convertSequelizeModel(user, UserDto);
    } else {
      throw new IncorrectPasswordError();
    }
  }

  /**
   * Signs the client up with the credentials.
   *
   * It will only sign them up, if the username and email address
   * has not been used.
   * @param username - Username
   * @param email - Email address
   * @param password - Password
   * @param offset - Offset for the profile picture
   */
  public static async signUp(
      username: string,
      email: string,
      password: string,
      offset: number,
      {ip}: ServiceContext,
  ): Promise<UserDto> {
    const ipLog = bindToLog(log, {prefix: 'IP %s: ', args: [ip]});
    const ipError = bindToLog(error, {prefix: 'IP %s: ', args: [ip]});

    // Check if a user with that username is already used
    // and that no user has used the email
    ipLog('Check if username "%s" already exists', username);
    const transaction = await db.transaction() as unknown as Transaction;
    try {
      await UserRepository.findByUsername(username, {transaction});
      throw new UsernameAlreadyExistsError(username);
    } catch (e) {
      if (e instanceof UserNotFoundError) {
        ipLog('Username not used');
      } else {
        await transaction.rollback();
        ipError('Unexpected error while checking if a user with ' +
          ' the username %s already exists', username);
        throw e;
      }
    }

    ipLog('Check if email address "%s" already used', email);
    if (await UserRepository.isEmailUsed(email, {transaction})) {
      await transaction.rollback();
      throw new EmailAddressAlreadyUsedError(email);
    }

    let user;
    try {
      user = await UserRepository.create(
          username, email, password, {transaction});
    } catch (e) {
      await transaction.rollback();

      ipError(
          'Unexpected error while creating a the new user %s: %o', username, e);
      throw e;
    }

    // Create profile picture for user
    const pbData = await generateProfilePic(
        config.user.pb.dimensions,
        username,
        offset,
    );

    await ProfilePic.create({
      data: pbData,
      userId: user.id,
    }, {transaction: isTransaction(transaction)});

    // Commit all changes
    await transaction.commit();

    return ModelToDtoConverter
        .convertSequelizeModel(user, UserDto);
  }
}

export default AuthenticationService;
