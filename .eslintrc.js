module.exports = {
  env: {
    // browser: true,
    es2021: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'eslint-plugin-prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // "eslint-plugin-prettier",
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['*.ts', '*.tsx', '*.mts', '*.cts', '*.js', '*.mjs', '*.cjs'],
      rules: {
        // '@typescript-eslint/explicit-module-boundary-types': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
          },
        ],
        'no-empty-function': 'warn',
        '@typescript-eslint/no-empty-function': ['off'], // eslint has this one too
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    indent: ['off', 2, { SwitchCase: 1 }],
    'linebreak-style': ['off', 'auto'],
    quotes: ['off', 'single'],
    semi: ['error', 'always'],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
      },
    ],
  },
};
