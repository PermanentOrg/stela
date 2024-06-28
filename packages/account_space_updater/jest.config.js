sharedConfig = require("../../jest.config");
module.exports = {
  ...sharedConfig,
  moduleNameMapper: {
    "^@stela/(.*)$": "<rootDir>/../$1/src",
  },
};
