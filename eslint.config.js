import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "node_modules/",
      "dist/",
      "client/dist/",
      ".manus-logs/",
      "scripts/",
      "drizzle/migrations/",
      "server/_core/",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.mjs",
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript recommended (type-aware 아님 — 속도 우선)
  ...tseslint.configs.recommended,

  // Server-side rules
  {
    files: ["server/**/*.ts"],
    plugins: {
      sonarjs,
    },
    rules: {
      "sonarjs/cognitive-complexity": ["warn", 15],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",  // TypeScript handles this
      "no-useless-assignment": "warn",
      "no-async-promise-executor": "warn",
    },
  },

  // Client-side rules
  {
    files: ["client/src/**/*.ts", "client/src/**/*.tsx"],
    plugins: {
      "react-hooks": reactHooks,
      sonarjs,
    },
    rules: {
      "sonarjs/cognitive-complexity": ["warn", 15],
      ...reactHooks.configs.recommended.rules,
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off",  // TypeScript handles this
    },
  },

  // Shared rules
  {
    files: ["shared/**/*.ts"],
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-undef": "off",
    },
  }
);
