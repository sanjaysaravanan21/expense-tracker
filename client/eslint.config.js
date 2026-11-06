import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const features = ["auth", "dashboard"];
const featureBoundary = (name) => ({
  group: [`**/features/${name}`, `**/features/${name}/**`, `@/features/${name}`, `@/features/${name}/**`],
  message: "Features must not import other features; compose them in client/src/app.",
});

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["vite.config.ts", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
  // The context module intentionally exports the provider, hook and context together.
  {
    files: ["src/lib/app-context.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  // Architecture: shared client code must not depend on features or app.
  {
    files: ["src/{lib,components,hooks,utils,config}/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/features/**", "@/features/**", "**/app/**", "@/app/**"], message: "Shared code must not import from features or app." },
        ],
      }],
    },
  },
  // Architecture: a feature must not import another feature or app.
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/app/**", "@/app/**"], message: "Features must not import from app." },
          ...features.filter((f) => f !== feature).map(featureBoundary),
        ],
      }],
    },
  })),
);
