import {NextFunction, RequestHandler, Response} from 'express';
import {Socket} from 'socket.io';

/**
 * Wrap the specified middleware (RequestHandler) to
 * be compatible as socket middleware.
 * @param middleware - The middleware to wrap.
 */
export const wrapSocketMiddleware = (middleware: RequestHandler) =>
  (socket: Socket, next: NextFunction): RequestHandler =>
    middleware(socket.request, {} as unknown as Response, next);
