module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "quotes": ["error", "double"],
    "class-methods-use-this": [0, false],
    "prefer-arrow-callback": ["warn", { "allowNamedFunctions": true } ],
    "comma-dangle": ["error", { functions: "never" }],
    "max-len": ["warn", 140]
  },
};
