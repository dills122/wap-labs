import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export const createTsLintConfig = ({
  files,
  ignores = ['dist/**', 'node_modules/**'],
  env = 'browser'
}) => {
  const environmentGlobals =
    env === 'mixed'
      ? { ...globals.browser, ...globals.node }
      : env === 'node'
        ? globals.node
        : globals.browser;

  return [
    {
      files,
      ignores,
      languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: {
          ...environmentGlobals
        }
      },
      plugins: {
        '@typescript-eslint': tsPlugin
      },
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    },
    eslintConfigPrettier
  ];
};
