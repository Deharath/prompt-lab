const tsParser = require('@typescript-eslint/parser');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

const { fixupPluginRules } = require('@eslint/compat');

const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/*.d.ts',
      '**/vite.config.js',
      '**/vitest.config.js',
      '**/postcss.config.js',
      '**/tailwind.config.js',
    ],
  },

  // Base JavaScript/TypeScript configuration
  js.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
      react,
      'react-hooks': fixupPluginRules(reactHooks),
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // Disable standard no-unused-vars in favor of TypeScript version
      'no-unused-vars': 'off',

      // Code complexity and quality rules
      complexity: ['error', 10],
      'max-depth': ['error', 4],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 4],
      'no-console': ['warn'],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-magic-numbers': [
        'warn',
        { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true },
      ],
      'prefer-const': 'error',
      'no-var': 'error',

      // Basic TypeScript rules (not requiring type information)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/self-closing-comp': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // TypeScript source files configuration
  {
    files: [
      'packages/*/src/**/*.ts',
      'packages/*/src/**/*.tsx',
      'apps/*/src/**/*.ts',
      'apps/*/src/**/*.tsx',
    ],
    languageOptions: {
      parserOptions: {
        project: ['./packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // TypeScript rules requiring type information
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: true,
          allowAny: true,
        },
      ],
    },
  },

  // Test and config files configuration
  {
    files: [
      'packages/*/test/**/*.ts',
      'packages/*/test/**/*.tsx',
      'apps/*/test/**/*.ts',
      'apps/*/test/**/*.tsx',
      'packages/*/tsconfig*.ts',
      'apps/*/tsconfig*.ts',
      'packages/*/drizzle.config.ts',
      'apps/*/drizzle.config.ts',
    ],
    languageOptions: {
      parserOptions: {
        project: [
          './packages/*/tsconfig.lint.json',
          './apps/*/tsconfig.lint.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
  },

  // Vitest and test files configuration
  {
    files: [
      '**/vitest.config.mts',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      // Allow dev dependencies in test files
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
