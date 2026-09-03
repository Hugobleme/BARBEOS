import barbeosPlugin from "./eslint-plugin-barbeos/index.js";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      ".vercel/**",
      "dist/**",
      ".output/**",
      "node_modules/**",
      "src/integrations/**",
      "src/routeTree.gen.ts",
    ],
  },
  {
    files: ["src/routes/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      barbeos: barbeosPlugin,
      "react-hooks": {
        rules: {
          "exhaustive-deps": {
            create() {
              return {};
            },
          },
        },
      },
      "redos-detector": {
        rules: {
          "no-unsafe-regex": {
            create() {
              return {};
            },
          },
        },
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      "barbeos/lucide-imports": "error",
      "react-hooks/exhaustive-deps": "off",
      "redos-detector/no-unsafe-regex": "off",
    },
  },
];
