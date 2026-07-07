module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  plugins: ['perfectionist', 'unused-imports', 'prettier'],
  extends: ['airbnb', 'prettier', 'next/core-web-vitals'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      alias: {
        map: [['src', './src']],
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
      },
    },
  },
  /**
   * 0 ~ 'off'
   * 1 ~ 'warn'
   * 2 ~ 'error'
   */
  rules: {
    'no-use-before-define': 0,
    'no-alert': 0,
    'no-return-assign': 0,
    'import/order': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'lines-around-directive': 'off',
    'import/no-cycle': 'off',
    'import/no-unresolved': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/jsx-boolean-value': 'off',
    'no-undef': 'off',
    'no-shadow': 'off',
    'no-restricted-globals': 'off',
    'react/no-unescaped-entities': 'off',
    'react/self-closing-comp': 'off',
    'no-else-return': 'off',
    'no-empty-pattern': 'off',
    'import/no-duplicates': 'off',
    'object-shorthand': 'off',
    'no-plusplus': 'off',
    'consistent-return': 'off',
    camelcase: 0,
    'no-console': 0,
    'no-unused-vars': 0,
    'no-nested-ternary': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'no-restricted-exports': 0,

    'no-promise-executor-return': 0,
    'import/prefer-default-export': 0,
    'prefer-destructuring': [1, { object: true, array: false }],
    // react
    'react/prop-types': 0,
    'react/no-children-prop': 0,
    'react/react-in-jsx-scope': 0,
    'react/no-array-index-key': 0,
    'react/require-default-props': 0,
    'react/jsx-props-no-spreading': 0,
    'react/function-component-definition': 0,
    'react/jsx-no-duplicate-props': [1, { ignoreCase: false }],
    'react/jsx-no-useless-fragment': [1, { allowExpressions: true }],
    'react/no-unstable-nested-components': [1, { allowAsProps: true }],
    // jsx-a11y
    'jsx-a11y/anchor-is-valid': 0,
    'jsx-a11y/control-has-associated-label': 0,
    // unused imports
    'unused-imports/no-unused-imports': 1,
    'unused-imports/no-unused-vars': [
      0,
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    // perfectionist
    'perfectionist/sort-exports': 'off',
    'perfectionist/sort-named-imports': 'off',
    'perfectionist/sort-named-exports': 'off',
    'perfectionist/sort-imports': 'off',
    // 'perfectionist/sort-imports': [
    //   'error',
    //   {
    //     type: 'alphabetical',
    //     order: 'asc',
    //     fallbackSort: { type: 'unsorted' },
    //     ignoreCase: true,
    //     specialCharacters: 'keep',
    //     internalPattern: ['^~/.+'],
    //     partitionByComment: false,
    //     partitionByNewLine: false,
    //     newlinesBetween: 'always',
    //     maxLineLength: undefined,
    //     groups: [
    //       'style',
    //       'type',
    //       ['builtin', 'external'],
    //       'custom-mui',
    //       'custom-routes',
    //       'custom-hooks',
    //       'custom-utils',
    //       'internal',
    //       'custom-components',
    //       'custom-sections',
    //       'custom-auth',
    //       'custom-types',
    //       ['parent', 'sibling', 'index'],
    //     ],
    //     customGroups: {
    //       type: {
    //         'custom-mui': '^@mui/.*',
    //       },
    //       value: {
    //         'custom-auth': '^src/auth/.*',
    //         'custom-hooks': '^src/hooks/.*',
    //         'custom-utils': '^src/utils/.*',
    //         'custom-types': '^src/types/.*',
    //         'custom-routes': '^src/routes/.*',
    //         'custom-sections': '^src/sections/.*',
    //         'custom-components': '^src/components/.*',
    //       },
    //     },
    //     environment: 'node',
    //   },
    // ],
  },
};
