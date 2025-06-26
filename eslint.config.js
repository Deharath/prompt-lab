const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

const {
    fixupPluginRules,
    fixupConfigRules,
} = require("@eslint/compat");

const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [
    {
        ignores: [
            "**/dist", 
            "**/node_modules", 
            "**/.eslintrc.js", 
            "**/*.d.ts",
            "**/vite.config.js",
            "**/vitest.config.js"
        ]
    },
    
    // Base JavaScript/TypeScript configuration
    js.configs.recommended,
    
    {
        files: ["**/*.{js,mjs,cjs,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                tsconfigRootDir: __dirname,
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.node,
                ...globals.browser
            },
        },

        plugins: {
            "@typescript-eslint": typescriptEslint,
            prettier,
            react,
            "react-hooks": fixupPluginRules(reactHooks),
        },

        settings: {
            react: {
                version: "detect",
            },
        },

        rules: {
            // Disable standard no-unused-vars in favor of TypeScript version
            "no-unused-vars": "off",
            // Basic TypeScript rules
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_"
                }
            ],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            
            // React rules
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            
            // Prettier integration
            "prettier/prettier": "error"
        },
    },

    // TypeScript source files configuration
    {
        files: [
            "packages/*/src/**/*.ts",
            "packages/*/src/**/*.tsx",
            "apps/*/src/**/*.ts",
            "apps/*/src/**/*.tsx",
        ],
        languageOptions: {
            parserOptions: {
                project: ["./packages/*/tsconfig.json", "./apps/*/tsconfig.json"],
                tsconfigRootDir: __dirname,
            },
        },
    },

    // Test and config files configuration
    {
        files: [
            "packages/*/test/**/*.ts",
            "packages/*/test/**/*.tsx",
            "apps/*/test/**/*.ts",
            "apps/*/test/**/*.tsx",
            "packages/*/*.config.ts",
            "apps/*/*.config.ts",
            "packages/*/*.config.js",
            "apps/*/*.config.js",
        ],
        languageOptions: {
            parserOptions: {
                project: ["./packages/*/tsconfig.lint.json", "./apps/*/tsconfig.lint.json"],
                tsconfigRootDir: __dirname,
            },
        },
    },

    // Vitest and test files configuration
    {
        files: [
            "**/vitest.config.mts",
            "**/vite.config.ts",
            "**/vitest.config.ts",
            "**/*.test.ts",
            "**/*.test.tsx",
        ],
        rules: {
            // Allow dev dependencies in test files
            "@typescript-eslint/no-explicit-any": "off"
        },
    },
];
