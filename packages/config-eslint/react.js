import pluginReact from "eslint-plugin-react";
import globals from "globals";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { config as baseConfig } from "./index.js";

const reactRecommended = pluginReact.configs.flat.recommended;
const reactHooksRecommendedLatest = pluginReactHooks.configs["recommended-latest"];
const browserGlobals = {
  ...globals.serviceworker,
  ...globals.browser,
};

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config} */
export const config = [
  ...baseConfig,
  {
    ...reactRecommended,
    languageOptions: {
      ...reactRecommended.languageOptions,
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...(reactRecommended.languageOptions?.globals ?? {}),
        ...browserGlobals,
      },
    },
    plugins: {
      ...(reactRecommended.plugins ?? {}),
      ...(reactHooksRecommendedLatest.plugins ?? {}),
    },
    settings: {
      ...(reactRecommended.settings ?? {}),
      react: { version: "detect" },
    },
    rules: {
      ...(reactRecommended.rules ?? {}),
      ...(reactHooksRecommendedLatest.rules ?? {}),
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
    },
  },
];
