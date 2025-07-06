// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import js from '@eslint/js';

export default [
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/*.d.ts',
      '**/vite.config.js',
      '**/vitest.config.js',
      '**/postcss.config.js',
      '**/tailwind.config.js',
      '**/__mocks__/**',
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
        tsconfigRootDir: new URL('.', import.meta.url).pathname.slice(1),
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
      complexity: 'off',
      'max-depth': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'max-params': 'off',
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'off',
      'no-magic-numbers': 'off',
      'prefer-const': 'off',
      'no-var': 'off',

      // Basic TypeScript rules (not requiring type information)
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-useless-fragment': 'off',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/self-closing-comp': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // Type-aware rules for apps/api
  {
    files: ['apps/api/src/**/*.ts', 'apps/api/src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./apps/api/tsconfig.json'],
        tsconfigRootDir: new URL('.', import.meta.url).pathname.slice(1),
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  // Type-aware rules for apps/web
  {
    files: ['apps/web/src/**/*.ts', 'apps/web/src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./apps/web/tsconfig.json'],
        tsconfigRootDir: new URL('.', import.meta.url).pathname.slice(1),
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  // Type-aware rules for packages/evaluation-engine
  {
    files: [
      'packages/evaluation-engine/src/**/*.ts',
      'packages/evaluation-engine/src/**/*.tsx',
    ],
    languageOptions: {
      parserOptions: {
        project: ['./packages/evaluation-engine/tsconfig.json'],
        tsconfigRootDir: new URL('.', import.meta.url).pathname.slice(1),
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  // Type-aware rules for packages/evaluator
  {
    files: [
      'packages/evaluator/src/**/*.ts',
      'packages/evaluator/src/**/*.tsx',
    ],
    languageOptions: {
      parserOptions: {
        project: ['./packages/evaluator/tsconfig.json'],
        tsconfigRootDir: new URL('.', import.meta.url).pathname.slice(1),
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
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
        tsconfigRootDir: new URL('.', import.meta.url).pathname.slice(1),
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
