module.exports = {
  'env': {
    'es6': true,
    'node': true,
  },
  'extends': [
    'google',
    'plugin:@typescript-eslint/recommended',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
    'tsconfigRootDir': __dirname,
  },
  'plugins': [
    '@typescript-eslint',
    "@typescript-eslint/eslint-plugin",
    "eslint-plugin-tsdoc",
  ],
  'rules': {
    "new-cap": "off",
    "valid-jsdoc": "off",
    "tsdoc/syntax": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "next" } ]
  },
};
