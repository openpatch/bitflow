module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["tests/**/*.{ts,tsx,js,jsx}"],
  transform: { ".(ts|tsx)$": "ts-jest/dist" },
  transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
