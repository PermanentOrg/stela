sharedConfig = require("../../jest.config");
module.exports = {
	...sharedConfig,
	moduleNameMapper: {
		"^@stela/(.*)$": "<rootDir>/../$1/src",
	},
	setupFiles: ["<rootDir>/jest.env.setup.js"],
	modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
