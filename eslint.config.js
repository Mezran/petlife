import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig(
  // Generated output is never linted (node_modules is ignored by default)
  globalIgnores(["**/dist/", "**/coverage/"]),

  // All TypeScript: full type-aware strictness via each package's tsconfig
  {
    files: ["**/*.ts"],
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

  // Plain JS at the root (this file, prettier.config.js): baseline rules,
  // no type information — these files belong to no tsconfig project
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
  },

  // Always last: disable every rule that would fight Prettier
  eslintConfigPrettier,
);
