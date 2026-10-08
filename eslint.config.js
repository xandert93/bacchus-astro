// ESLint: catches mistakes and enforces the code style Prettier can't (Prettier
// only decides layout). Run with `npm run lint`; `npm run lint:fix` applies
// every fix that can't change behaviour.

import javascript from "@eslint/js"
import astro from "eslint-plugin-astro"
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions"
import globals from "globals"
import typescript from "typescript-eslint"

export default [
  // ESLint doesn't read .gitignore, so anything ignored there that holds
  // JavaScript is listed again here. public/prototype/ is the local-only copy
  // of the prototype's sandboxes, written in the prototype's older style.
  //
  // These need the `**/` prefix, unlike .gitignore's patterns: a flat-config
  // ignore is anchored to the repo root, so a bare "dist/" misses
  // sanity/dist/. The Studio is a nested package with its own build output,
  // and linting an unminified Studio bundle takes long enough to look like a
  // hang.
  {
    ignores: [
      "**/dist/",
      ".astro/",
      "**/node_modules/",
      "test-results/",
      "playwright-report/",
      "public/prototype/",
      "sanity/.sanity/",
    ],
  },

  javascript.configs.recommended,
  ...typescript.configs.recommended,
  ...astro.configs.recommended,

  // Site code runs in the browser; tests and config run in Node. The tooling
  // scripts run in Node but pass functions to Playwright's page.evaluate(),
  // which run in the browser, so they get both.
  {
    files: ["src/**/*.{js,ts,astro}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["tests/**/*.ts", "sanity/**/*.ts", "*.{js,mjs,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  {
    rules: {
      // A leading underscore marks a value taken out on purpose and not used
      // (Button's `slot: _slot`, removed from the attributes it passes on).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },

  {
    plugins: { "prefer-arrow-functions": preferArrowFunctions },
    rules: {
      // Arrow functions by default. The rule only converts a function when
      // that can't change what it does (no `this`, `arguments` or `new`).
      "prefer-arrow-functions/prefer-arrow-functions": "error",

      // Block-scoped variables only, and const unless it's reassigned.
      "no-var": "error",
      "prefer-const": "error",

      // A const arrow function isn't hoisted, so calling it above its
      // definition in the same scope throws. References from inside another
      // function are fine (it has been defined by the time that runs).
      "no-use-before-define": [
        "error",
        { functions: true, classes: true, variables: false },
      ],
    },
  },
]
