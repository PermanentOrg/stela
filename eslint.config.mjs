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
			"import/prefer-default-export": "off",
			"import/no-default-export": "error",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-magic-numbers": [
				"error",
				{ ignore: [0, 1], ignoreEnums: true },
			],
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
			"@typescript-eslint/no-magic-numbers": "off",
			// async methods without awaits are sometimes needed for mocking
			"@typescript-eslint/require-await": "off",
		},
	},
]);
