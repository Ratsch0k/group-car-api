import config from '@config';
import jwt from 'jsonwebtoken';
import User from '@app/models/user/user';
import {UnauthorizedError} from '@errors';

type RequestHandler = import('express').RequestHandler;

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
 * @returns   The jwt which contains the given payload as data and the given
 *    subject in the sub field.
 */
export function generateToken(payload: object,
    subject?: string) {
  if (payload instanceof User) {
    return jwt.sign(
        convertUserToJwtPayload(payload),
        config.jwt.secret,
        config.jwt.getOptions(payload.username));
  } else {
    return jwt.sign(
        payload,
        config.jwt.secret,
        config.jwt.getOptions(subject));
  }
}

export interface UserJwtPayload {
  username: string;
  isBetaUser: boolean;
  loggedIn: boolean;
}
/**
 * Generates the payload for a jwt token for the given user.\
 * The payload should includes the following:
 * - Username       `username`
 * - whether or not the user has beta access `isBetaUser`
 * @param user The user for which the payload should be generated.
 * @returns   The user converted into a jwt payload
 */
export function convertUserToJwtPayload(user: User): UserJwtPayload {
  if (user) {
    return {
      username: user.username,
      isBetaUser: user.isBetaUser,
      loggedIn: true,
    };
  } else {
    throw new TypeError('Can\' generate payload if ' +
        'no user is given');
  }
}

/**
 * Request handler which throws an `UnauthorizedError` if
 * the provided jwt token (which is expected to be in `req.user`)
 * was created before the user logged in or after it.
 * @param req Http request
 * @param res Http response
 * @param next Next handler
 */
export const preLoginJwtValidator: RequestHandler = (req: any, res, next) => {
  if (!req.user || !req.user.loggedIn) {
    throw new UnauthorizedError();
  } else {
    next();
  }
};

/**
 * Cookie options for the jwt. Same is in `config.jwt.cookieOptions`.
 */
export const cookieOptions = config.jwt.cookieOptions;
