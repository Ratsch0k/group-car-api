/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates a mixin class from the given base classes.
 * @param derived - The object to apply the mixin to
 * @param bases    - An array of classes which should be mixed
 */
export const applyMixin = (derived: any, bases: any[]): void => {
  bases.forEach((base) => {
    Object.getOwnPropertyNames(base.prototype).forEach((name) => {
      Object.defineProperty(
          derived.prototype,
          name,
          Object.getOwnPropertyDescriptor(
              base.prototype,
              name,
          ) as PropertyDescriptor,
      );
    });
  });
};
