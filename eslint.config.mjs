import { defineConfig } from "eslint/config";
import typescriptEslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import love from "eslint-config-love";
import globals from "globals";
import jest from "eslint-plugin-jest";
import js from "@eslint/js";

export default defineConfig([
	js.configs.recommended,
	typescriptEslint.configs.eslintRecommended,
	typescriptEslint.configs.recommendedTypeChecked,
	typescriptEslint.configs.strict,
	love,
	prettier,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},

			parserOptions: {
				project: "./tsconfig.json",
			},
		},

		rules: {
			"dot-notation": "off",
			"lines-between-class-members": "off",
			"no-shadow": "off",
			"no-undef": "off",
			"no-unused-vars": "off",
			"no-use-before-define": "off",
			"require-await": "off",
			"import/prefer-default-export": "off",
			"import/no-default-export": "error",
			"import/extensions": "off",
			"import/no-unresolved": "off",
			"import/no-extraneous-dependencies": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/prefer-readonly-parameter-types": "off",

			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],

			"@typescript-eslint/no-throw-literal": "off",

			// These are `love` rules that we were violating.  We should review these one at a time.
			"@typescript-eslint/strict-boolean-expressions": "off",
			"@typescript-eslint/no-magic-numbers": "off",
			"no-implicit-globals": "off",
			"max-lines": "off",
			"@typescript-eslint/prefer-destructuring": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/consistent-type-imports": "off",
			"@typescript-eslint/no-unsafe-type-assertion": "off",
			"@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
			"@typescript-eslint/return-await": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/consistent-type-assertions": "off",
			"@typescript-eslint/consistent-type-assertions": "off",
			"@typescript-eslint/no-unnecessary-type-conversion": "off",
			complexity: "off",
			"@typescript-eslint/no-unnecessary-condition": "off",
			"import/enforce-node-protocol-usage": "off",
			"@typescript-eslint/array-type": "off",
			"@typescript-eslint/max-params": "off",
			"@typescript-eslint/naming-convention": "off",
			"@typescript-eslint/prefer-nullish-coalescing": "off",
			"@typescript-eslint/switch-exhaustiveness-check": "off",
			"@typescript-eslint/prefer-optional-chain": "off",
			"@typescript-eslint/no-unnecessary-template-expression": "off",
		},
	},
	{
		files: ["**/*.test.ts"],

		plugins: {
			jest,
		},

		rules: {
			"@typescript-eslint/unbound-method": "off",
			"jest/unbound-method": "error",
			"jest/no-focused-tests": "error",
			// Test files are allowed to be long because they need to be able to comprehensively test
			// the relevant code, however many tests that takes. Their natural structure also makes
			// them more navigable than other lengthy files might be.
			"max-lines": "off",
		},
	},
]);
