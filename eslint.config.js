const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettier = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
	js.configs.recommended,
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module",
			},
			globals: {
				process: "readonly",
				console: "readonly",
				__dirname: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			prettier: prettier,
		},
		rules: {
			"@typescript-eslint/no-unused-vars": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"no-console": "off",
			"prettier/prettier": "warn",
		},
	},
	prettierConfig,
	{
		ignores: ["node_modules", "dist"],
	},
];