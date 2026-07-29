import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(dirname, 'index.html'),
        devtools: path.resolve(dirname, 'devtools.html')
      }
    }
  },
  server: {
    fs: {
      // Local examples and the browser-test WASM package live outside frontend/.
      allow: [path.resolve(dirname, '../..')]
    }
  }
});
