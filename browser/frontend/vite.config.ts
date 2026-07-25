import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    // The vendored Win95 stylesheet contains legacy WebKit scrollbar selectors
    // that Lightning CSS rejects even though browsers safely ignore them.
    cssMinify: 'esbuild'
  },
  server: {
    fs: {
      // Local examples and the browser-test WASM package live outside frontend/.
      allow: [path.resolve(dirname, '../..')]
    }
  }
});
