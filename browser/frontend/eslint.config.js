import { createTsLintConfig } from '../../eslint.shared.mjs';

export default createTsLintConfig({
  files: ['src/**/*.ts'],
  env: 'browser'
});
