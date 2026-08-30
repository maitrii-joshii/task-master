/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/tests/unit"],

  testMatch: ["**/*.test.ts", "**/*.spec.ts"],

  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],

  coverageDirectory: "coverage",

  clearMocks: true,
  restoreMocks: true,

  // Prevent Jest from creating multiple worker processes.
  // This avoids Node.js heap exhaustion on large test files.
  maxWorkers: 1,

  moduleFileExtensions: ["ts", "js", "json"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },

  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
};
