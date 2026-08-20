import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig(
  // Generated output is never linted (node_modules is ignored by default)
  globalIgnores(["**/dist/", "**/coverage/"]),

  // All TypeScript: full type-aware strictness via each package's tsconfig
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React (apps/web only): the rules of hooks, and keep every module
  // HMR-refreshable (react-refresh is what Vite's fast refresh rides on)
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },

  // Plain JS at the root (this file, prettier.config.js): baseline rules,
  // no type information — these files belong to no tsconfig project
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
  },

  // Always last: disable every rule that would fight Prettier
  eslintConfigPrettier,
);
