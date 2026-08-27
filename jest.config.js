/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  clearMocks: true,
  setupFiles: ["<rootDir>/tests/setup.ts"],
};
