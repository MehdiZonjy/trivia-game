module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "<rootDir>/test/**/*.test.ts",
  ],
  moduleDirectories: [
    "node_modules"
    // "<rootDir>/lib"
  ],
  testEnvironment: 'node',
  // "setupFiles": ["<rootDir>/test/setup.js"]
};