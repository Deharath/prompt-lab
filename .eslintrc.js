module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier', 'react', 'react-hooks'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: {},
    },
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.js',
  ],
  overrides: [
    {
      files: [
        'packages/*/src/**/*.ts',
        'packages/*/src/**/*.tsx',
        'apps/*/src/**/*.ts',
        'apps/*/src/**/*.tsx',
      ],
      parserOptions: {
        project: [
          './packages/*/tsconfig.json',
          './apps/*/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: [
        'packages/*/test/**/*.ts',
        'packages/*/test/**/*.tsx',
        'apps/*/test/**/*.ts',
        'apps/*/test/**/*.tsx',
        'packages/*/*.config.ts',
        'apps/*/*.config.ts',
        'packages/*/*.config.js',
        'apps/*/*.config.js',
      ],
      parserOptions: {
        project: [
          './packages/*/tsconfig.lint.json',
          './apps/*/tsconfig.lint.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: [
        'vitest.config.mts',
        '**/vite.config.ts',
        '**/vitest.config.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },
  ],
};
