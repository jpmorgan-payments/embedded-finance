// @ts-check
//
// ESLint 10 flat configuration.
// Replaces the deprecated eslintrc format (.eslintrc.cjs) and the abandoned
// `eslint-config-mantine` / airbnb base. This is a self-contained modern stack:
//   @eslint/js + typescript-eslint + react + react-hooks + jsx-a11y
//   + tailwindcss (eb- prefix aware) + storybook, with prettier applied last.
//
// Performance / scope decision: type-aware linting is intentionally NOT enabled
// (no `parserOptions.projectService`). Building a full TypeScript program on
// every run made `eslint .` 5-15x slower just to power a single type-aware rule.
// Type safety is owned by `tsc` (`yarn typecheck`), which already runs in CI
// ahead of lint. ESLint here is syntactic-only: React / hooks / a11y / tailwind
// / import + the syntactic typescript-eslint rules. The type-aware rules we
// forgo (e.g. no-floating-promises) are tracked as an opt-in `lint:types`
// follow-up under BACKLOG BL-505.
//
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files

import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import tailwind from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Opt-in style linting (`yarn lint:styles`, ESLINT_STYLES=1).
// The tailwind / eb- prefix rules — above all `no-custom-classname` — are
// pathologically slow in eslint-plugin-tailwindcss@3 (~90% of total lint time,
// see BL-505). They are non-blocking (all "warn"), so they are excluded from the
// fast default `yarn lint` and only run on demand via `yarn lint:styles`.
const includeStyleRules = process.env.ESLINT_STYLES === '1';

export default tseslint.config(
  // ---------------------------------------------------------------------------
  // 1. Global ignores (replaces .eslintignore / ignorePatterns)
  //    Only TS/TSX source is linted; JS config files + generated + build output
  //    are excluded.
  // ---------------------------------------------------------------------------
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      'node_modules/**',
      '.yarn/**',
      // orval-generated API clients are not hand-maintained — do not lint them.
      'src/api/generated/**',
      '**/*.d.ts',
      '**/*.d.mts',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Base recommended rule sets
  // ---------------------------------------------------------------------------
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------------------
  // 3. React / hooks / a11y
  // ---------------------------------------------------------------------------
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,

  // ---------------------------------------------------------------------------
  // 4. Project-wide language options, settings, and rule overrides
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      // No `parserOptions.projectService` on purpose: type-aware linting is
      // disabled (see header note). ESLint parses syntax only; `tsc` owns types.
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      import: importPlugin,
      // Register the tailwind plugin (shimmed for ESLint 10) so its rule names
      // always resolve — this keeps inline `eslint-disable tailwindcss/*`
      // directives valid even though the rules only *run* in `lint:styles`
      // (ESLINT_STYLES=1). Registering is free; only running a rule costs time.
      tailwindcss: fixupPluginRules(tailwind),
    },
    settings: {
      // Pin the React version explicitly. `detect` triggers eslint-plugin-react's
      // legacy version-detection code path, which calls the `context.getFilename()`
      // API removed in ESLint 10 and crashes. See eslint-plugin-react#3699.
      react: { version: '18.3' },
    },
    rules: {
      // --- React ---
      'react/react-in-jsx-scope': 'off', // React 17+ automatic JSX runtime
      'react/prop-types': 'off', // Types come from TypeScript
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- Stylistic preferences preserved from the legacy config ---
      'linebreak-style': 'off',
      'arrow-body-style': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // --- TypeScript ---
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Type-aware rules (e.g. `@typescript-eslint/no-floating-promises`) are
      // intentionally omitted: they require a full TS program that slows lint
      // dramatically. Unhandled-promise safety is deferred to a future opt-in
      // `lint:types` step (BACKLOG BL-505).

      // -----------------------------------------------------------------------
      // Migration triage (ESLint 8 -> 10).
      // The modern presets (js.recommended + typescript-eslint.recommended +
      // react.recommended + jsx-a11y.recommended) promote many rules to "error"
      // that were warnings/off under the legacy airbnb/mantine base. Per policy,
      // only genuinely critical *correctness* rules stay as errors; type-
      // strictness, stylistic, a11y and brand-new best-practice rules are kept
      // as warnings so a pre-existing violation does not block CI. Burn down the
      // warnings over time, then promote back to "error".
      // -----------------------------------------------------------------------
      // Type-strictness — high volume, not runtime bugs.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      // React dev-experience only (missing component displayName).
      'react/display-name': 'warn',
      // Accessibility — real but tracked/burned down separately, non-blocking.
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      // New ESLint 10 core rule — error-cause chaining best practice.
      'preserve-caught-error': 'warn',
      // Intentional short-circuit / ternary side-effects are used in the code
      // base (e.g. `isTouched && onChange?.(null)`); keep as error but allow.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],

      // --- Imports ---
      // `import/extensions` intentionally disabled: it ran full module resolution
      // per import (~24% of total lint time) for zero violations. TypeScript
      // (no `allowImportingTsExtensions`) + the bundler already reject bad or
      // extensioned import paths, so this airbnb holdover added cost, not safety.
      // See BL-505.
      'import/extensions': 'off',
      'import/order': 'off', // handled by @ianvs/prettier-plugin-sort-imports

      // Tailwind / eb- prefix rules live in the opt-in style block below
      // (`yarn lint:styles`), kept out of the fast default lint.
    },
  },

  // ---------------------------------------------------------------------------
  // 6. Storybook stories
  // ---------------------------------------------------------------------------
  ...storybook.configs['flat/recommended'],

  // ---------------------------------------------------------------------------
  // 7. Test files & test utilities — relax a few rules
  // ---------------------------------------------------------------------------
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      'test-utils/**/*.{ts,tsx}',
      '**/mocks/**/*.{ts,tsx}',
    ],
    rules: {
      'no-console': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // 8. Opt-in Tailwind / eb- prefix linting (`yarn lint:styles`, ESLINT_STYLES=1)
  //    eslint-plugin-tailwindcss@3 targets ESLint <=9 (shimmed via @eslint/compat)
  //    and `no-custom-classname` is pathologically slow (~65% of total lint time),
  //    so these non-blocking checks are excluded from the fast default `yarn lint`.
  // ---------------------------------------------------------------------------
  ...(includeStyleRules
    ? [
        {
          files: ['**/*.{ts,tsx}'],
          settings: {
            tailwindcss: {
              config: 'tailwind.config.js',
              callees: ['clsx', 'cva', 'cn'],
              // Allow the library's mandatory custom prefix.
              whitelist: ['eb\\-.*'],
            },
          },
          rules: {
            'tailwindcss/classnames-order': 'warn',
            'tailwindcss/no-contradicting-classname': 'warn',
            'tailwindcss/no-custom-classname': [
              'warn',
              { config: 'tailwind.config.js', whitelist: ['eb\\-.*'] },
            ],
          },
        },
      ]
    : []),

  // ---------------------------------------------------------------------------
  // 9. Prettier — MUST be last to disable stylistic rules that conflict with it
  // ---------------------------------------------------------------------------
  prettier
);
