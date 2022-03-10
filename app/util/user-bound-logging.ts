/**
 * Options for `bindToLog`.
 */
export interface Options {
  /**
   * The default prefix.
   * Will always be added in front of every message.
   */
  prefix?: string;

  /**
   * Custom bound args which will always be
   * added after the message but before any other
   * arguments.
   */
  args?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const defaultOptions = {
  prefix: 'User %d: ',
  args: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
};

/**
 * Binds custom default values to the given debug logging function.
 *
 * This is achieved by wrapping the log function and inserting
 * default values and arguments whenever it is called.
 * The default prefix `User %d: ` and the only default
 * added arguments is one number.
 *
 * To minimize any impact this wrapping could have,
 * the returned value gets all properties of the
 * original log function.
 *
 * *There could be a better way to achieve the same
 * result*
 *
 * @param log - The instance of logging function
 * @param options - Options for binding.
 *                  Defaults to `{prefix: 'User %d: ', args: []}`
 * @returns A bound version of the given logging function
 */
function bindToLog(
    log: debug.Debugger,
    options?: Options,
): debug.Debugger {
  options = {
    ...defaultOptions,
    ...options,
  };
  const {prefix, args: boundArgs} = options as Required<Options>;

  /**
   * Wraps the logging function.
   * This approach is used to be able to add
   * properties to the returned function.
   * @param formatter - Message
   * @param args - Any additional arguments
   */
  function debug(formatter: any, ...args: any[]) { // eslint-disable-line max-len, @typescript-eslint/no-explicit-any
    log(prefix + formatter, ...boundArgs, ...args);
  }

  const props = Object.getOwnPropertyNames(log);
  for (const prop of props) {
    const descriptor = Object.getOwnPropertyDescriptor(log, prop);
    if (descriptor?.writable) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (debug as any)[prop] = (log as any)[prop];
    }
  }

  // Because missing attributes are dynamically assigned,
  // typescript doesn't know its correct
  return debug as unknown as debug.Debugger;
}

export default bindToLog;
