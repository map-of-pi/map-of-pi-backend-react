/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/**/*.spec.ts"],
    verbose: true,
    forceExit: true,
    resetMocks: true,
    restoreMocks: true,
    clearMocks: true,
    setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts']
  };
  