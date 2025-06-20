module.exports = {
  extends: ['mantine', 'plugin:tailwindcss/recommended', 'prettier', 'plugin:storybook/recommended'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['tailwindcss'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'linebreak-style': 'off',
    'arrow-body-style': 'off',
    'tailwindcss/classnames-order': 'warn',
    'tailwindcss/no-custom-classname': [
      'warn',
      {
        config: 'tailwind.config.js',
        whitelist: ['eb\\-.*'], // Whitelist your custom prefix
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
        '': 'never',
      },
    ],
    'import/order': 'off',
  },
  ignorePatterns: [
    '*.js',
    '*.cjs',
    '*.mjs',
    '*.d.ts',
    '*.d.mts',
    'vite.config.ts',
  ],
};
