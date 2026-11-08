import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**", // build made by the end-to-end test run
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tests/**",
  ]),
  {
    rules: {
      // A leading underscore marks a value that is intentionally unused,
      // e.g. `const { passwordHash: _, ...safeUser } = user`
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
