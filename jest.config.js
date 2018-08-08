module.exports = {
  verbose: true,
  setupFiles: ["<rootDir>/tests/jestSetup.js"],
  setupTestFrameworkScriptFile: "<rootDir>/tests/jest.setup.js",
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/tests/__mocks__/styleMock.js"
  },
  "collectCoverageFrom": [
    
  ],
  "testEnvironment": "node"
};
