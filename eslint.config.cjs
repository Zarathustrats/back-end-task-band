const eslint = require('@eslint/js');
const typescriptEslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = typescriptEslint.config(
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      // NOTE(roman): any eslint rule can be disable here as needed
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
    ignores: ['.history', '.vscode', 'dist', 'node_modules'],
  },
  {
    files: ['eslint.config.mjs', 'prettier.config.cjs'],
    extends: [typescriptEslint.configs.disableTypeChecked],
  },
  prettier,
);
