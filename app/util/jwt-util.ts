import config from '@config';
import jwt from 'jsonwebtoken';
import User from '@app/users/user';

/**
 * Generates a jwt token with the given payload.\
 * If the payload is an instance of the class {@link User}
 * and the csrf parameter is provided, the method
 * {@link generatePayloadFromUserModel} is used to
 * generate the payload from the user.
 * @param payload Payload of the token
 * @param subject If the payload is not an instance of the model User
 *                This parameter is needed to set the subject header
 *                in the jwt header.
 */
export function generateToken(payload: object | string, subject?: string) {
  if (payload instanceof User) {
    return jwt.sign(
        generatePayloadFromUserModel(payload),
        config.jwt.secret,
        config.jwt.getOptions(payload.username));
  } else if (subject) {
    return jwt.sign(payload, config.jwt.secret, config.jwt.getOptions(subject));
  } else {
    throw new Error('Can\'t create a token without a subject');
  }
}
/**
 * Generates the payload for a jwt token for the given user.\
 * The payload should includes the following:
 * - Id of the user `id`
 * - Username       `username`
 * - whether or not the user has beta access `isBetaUser`
 * - CSRF token `XSRF-TOKEN`
 * @param user The user for which the payload should be generated.
 */
export function generatePayloadFromUserModel(user: User) {
  if (user) {
    return {
      'id': user.id,
      'username': user.username,
      'isBetaUser': user.isBetaUser,
    };
  } else {
    throw new Error('Can\' generate payload if ' +
        'no user is given');
  }
}

/**
 * Cookie options for the jwt. Same is in `config.jwt.cookieOptions`.
 */
export const cookieOptions = config.jwt.cookieOptions;
