import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import importX from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import tseslint from "typescript-eslint";

const tsFilePatterns = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];

const withTsFiles = (configs) =>
  configs.map((config) => ({
    ...config,
    files: config.files ?? tsFilePatterns,
  }));

const typeCheckedConfigs = [
  ...withTsFiles(tseslint.configs.strictTypeChecked),
  ...withTsFiles(tseslint.configs.stylisticTypeChecked),
];

const edgeRuntimeGlobals = {
  fetch: false,
  Response: false,
  Request: false,
  addEventListener: false,
};

const disabledNodeRules = Object.fromEntries(
  [
    "no-missing-import",
    "no-missing-require",
    "no-deprecated-api",
    "no-unpublished-import",
    "no-unpublished-require",
    "no-unsupported-features/es-syntax",
    "no-unsupported-features/node-builtins",
  ].map((rule) => [`n/${rule}`, "off"])
);

const typescriptRuleOverrides = {
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports" },
  ],
  "@typescript-eslint/no-empty-object-type": "off",
  "@typescript-eslint/no-unsafe-function-type": "off",
  "@typescript-eslint/no-empty-function": [
    "error",
    { allow: ["arrowFunctions"] },
  ],
  "@typescript-eslint/no-unused-expressions": "off",
  "@typescript-eslint/no-empty-interface": "off",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-inferrable-types": "off",
  "@typescript-eslint/no-require-imports": "off",
  "@typescript-eslint/no-unused-vars": "warn",
  "@typescript-eslint/no-var-requires": "off",
};

/**
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  {
    ignores: [".wrangler/**/*", "**/.wrangler/**/*"],
  },
  js.configs.recommended,
  nodePlugin.configs["flat/recommended"],
  ...typeCheckedConfigs,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "import-x": importX,
    },
    languageOptions: {
      globals: edgeRuntimeGlobals,
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        project: true,
      },
    },
    rules: {
      curly: ["error", "all"],
      "no-debugger": ["error"],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-process-exit": "off",
      "no-useless-escape": "off",
      "prefer-const": ["warn", { destructuring: "all" }],
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import-x/order": [
        "error",
        {
          groups: [
            "external",
            "builtin",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import-x/no-duplicates": "error",
      ...disabledNodeRules,
      ...typescriptRuleOverrides,
    },
  },
  prettier,
];

export default config;
