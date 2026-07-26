import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/main.ts',
        // Browser-only E2E harnesses are executed by the rendered Playwright gates.
        'src/browser-test-main.ts',
        'src/test-support/wasm-browser-test-host.ts',
        'src/test-support/waves-story-observation.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 78
      }
    }
  }
});
