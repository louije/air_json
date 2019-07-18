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
    "arrow-body-style": [0, "as-needed"],
    "class-methods-use-this": [0, false],
    "comma-dangle": ["error", { functions: "never" }],
    "max-len": ["warn", 140],
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-return-assign": ["error", "except-parens"],
    "no-underscore-dangle": [0, false],
    "prefer-arrow-callback": ["warn", { "allowNamedFunctions": true } ],
    "quotes": ["error", "double"]
  },
};
