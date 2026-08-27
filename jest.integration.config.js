/** @type {import("jest").Config} */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/integration"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  clearMocks: true,
  maxWorkers: 1,
};
