import {Includeable} from 'sequelize/types';

/**
 * The options which can be used for the sequelize query options.
 */
export interface QueryOptions {
  include: Includeable[] | undefined;
  attributes: {exclude: string[]} | undefined;
}

/**
 * One entry of the options list.
 *
 * This entry defines an options which should be
 * checked and how to handle it.
 */
export interface OptionsListEntry {
  /**
   * Key of the option.
   */
  key: string;

  /**
   * List of models to include in the query.
   */
  include: Includeable[];

  /**
   * List of attributes to exclude in the query.
   */
  exclude: string[];
}
/**
 * Builds a method for handling options and generating
 * include and attribute excludes from it.
 * @param optionsList     - The list of options to handle
 * @param defaultOptions  - The default options
 */
export const buildFindQueryOptionsMethod = (
    optionsList: OptionsListEntry[],
    defaultOptions?: Record<string, unknown>,
) => (
    options?: Record<string, unknown>,
): QueryOptions => {
  // Merge option objects
  let mergedOptions: Record<string, unknown> = {};
  if (defaultOptions) {
    mergedOptions = defaultOptions;
  }
  if (options) {
    mergedOptions = {
      ...mergedOptions,
      ...options,
    };
  }

  const include: Includeable[] = [];
  const attributes = {
    exclude: [] as string[],
  };

  // Iterate through options and update include and exclude list.
  for (let i = 0; i < optionsList.length; i++) {
    const entry = optionsList[i];

    if (mergedOptions[entry.key]) {
      include.push(...entry.include);
      attributes.exclude.push(...entry.exclude);
    }
  }

  return {
    include: include.length <= 0 ? undefined : include,
    attributes: attributes.exclude.length > 0 ? attributes : undefined,
  };
};
