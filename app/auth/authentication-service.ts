import {User, UserDto, UserRepository, UserService} from '@models';
import {UserNotFoundError} from '@errors';
import {debug} from 'debug';
import bindToLog from '@util/user-bound-logging';
import {ServiceContext} from '@models/service';
import ModelToDtoConverter from '@util/model-to-dto-converter';

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
  ): Promise<UserDto | null> {
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
        return null;
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
      return null;
    }
  }
}

export default AuthenticationService;
