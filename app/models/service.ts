import {Request} from 'express';

export interface ServiceContext {
  ip: string;
  user?: Express.User;
  readonly cookies?: {string: string};
  readonly headers?: {string: string | string[]};
}

export const reqToContext = (req: Request): ServiceContext => {
  return {
    ip: req.ip,
    user: req.user,
    cookies: req.cookies,
    headers: req.headers as {string: string | string[]},
  };
};
