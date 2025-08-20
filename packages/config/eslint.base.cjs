module.exports = {
    root: true,
    extends: ["eslint:recommended"],
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    env: { node: true, es2023: true, browser: true },
    rules: { "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] }
  };
  