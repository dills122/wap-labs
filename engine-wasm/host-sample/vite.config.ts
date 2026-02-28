import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: {
    fs: {
      // Allow importing wasm-pack output from ../pkg.
      allow: [path.resolve(__dirname, '..')]
    }
  }
});
