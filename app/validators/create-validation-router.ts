import {Router, RouterOptions, Request} from 'express';
import {ValidationChain} from 'express-validator';
import {
  createValidationResultHandler,
  ValidationResultHandlerOptions,
} from '@util/validation-result-handler';

export interface CreateValidationRouterOptions {
  resultHandlerOptions?: ValidationResultHandlerOptions;
  scopePrefix?: string;
  path?: string;
  routerOptions?: RouterOptions;
}

export const defaultOptions = {
  scopePrefix: 'group-car:',
  path: '/',
  routerOptions: {
    mergeParams: true,
  },
};

/**
 * Crates a validation router which runs the validation chain and
 * handles the results.
 *
 * This method creates a router, with the default path set
 * to `/`, adds the given validation chain (single or as array) as the first
 * handler, and then a request handler which handles the results.
 * For this, it uses the RequestHandler returned
 * by {@link createValidationResultHandler}.
 *
 * The function provides a default mechanism for populating the necessary
 * arguments of the router and the result handler. As mentioned before, the
 * default path is `/`, the default debug namespace used in the result handler
 * will be **group-car:\{name\}** with *\{name\}* replaced by the given
 * argument and `requestName` set to the `message` parameter.
 * Router options are explicitly set to `mergeParams: true` to support
 * of the *params* validation type. *With the `options` argument you can
 * set the arguments of the router and the result handler.
 * @param name - The name of the router. Will be used as a suffix
 *                for the debug namespace.
 * @param validationChain - The actual validation chain
 * @param message - The message to log when checking the results
 * @param options - Additional options to modify default behaviour
 */
export const createValidationRouter = (
    name: string,
    validationChain: ValidationChain | ValidationChain[],
    message: ((req: Request) => string) | string,
    options?: CreateValidationRouterOptions,
): Router => {
  // Get options
  if (options !== undefined) {
    options = {
      ...defaultOptions,
      ...options,
    };
  } else {
    options = defaultOptions;
  }
  const resultHandlerOptions = options.resultHandlerOptions ||
    {debugScope: options.scopePrefix + name, requestName: message};
  const path = options.path || defaultOptions.path;
  const routerOptions = defaultOptions.routerOptions || options.routerOptions;

  // Convert the validation chain into an array if it only a single one.
  if (!Array.isArray(validationChain)) {
    validationChain = [validationChain];
  }

  return Router(routerOptions).use(
      path,
      validationChain,
      createValidationResultHandler(resultHandlerOptions),
  );
};

export default createValidationRouter;
