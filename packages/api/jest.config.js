sharedConfig = require("../../jest.config");
module.exports = {
	...sharedConfig,
	moduleNameMapper: {
		"^@stela/(.*)$": "<rootDir>/../$1/src",
	},
	setupFiles: ["<rootDir>/jest.env.setup.js"],
	globalSetup: "<rootDir>/jest.db.setup.ts",
	globalTeardown: "<rootDir>/jest.db.teardown.ts",
	modulePathIgnorePatterns: ["<rootDir>/dist/"],
	maxWorkers: "50%",
};
