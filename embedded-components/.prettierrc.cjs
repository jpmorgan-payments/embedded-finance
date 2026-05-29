// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  printWidth: 80,
  singleQuote: true,
  trailingComma: 'es5',
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  importOrder: [
    '^(react$)',
    '<BUILTIN_MODULES',
    '<THIRD_PARTY_MODULES>',
    '^@test-utils$',
    '^@storybook-themes$',
    '',
    '^types$',
    '^@/types/(.*)$',
    '^@/config/(.*)$',
    '^@/lib/(.*)$',
    '^@/shared/(.*)$',
    '^@/contexts/(.*)$',
    '^@/hooks/(.*)$',
    '^@/api/(.*)$',
    '^@/components/ui/(.*)$',
    '^@/components/(.*)$',
    '^@/core/(.*)$',
    '',
    '^[./]',
  ],
  tailwindFunctions: ['clsx', 'cva'],
  tailwindAttributes: ['labelClassName'],
};
