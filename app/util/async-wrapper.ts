/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {RequestHandler} from 'express';

/**
 * Wrapper for async function. Creates an request handler
 * which will call the given RequestHandler and catch
 * errors by calling the next function.
 * @param fn - Function to wrap
 */
export const asyncWrapper = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
