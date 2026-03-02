import { createTsLintConfig } from '../../eslint.shared.mjs';

export default createTsLintConfig({
  files: ['**/*.ts'],
  ignores: ['dist/**', 'node_modules/**', '.generated/**'],
  env: 'mixed'
});
