import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Use relative asset paths so dist can be hosted under /simulator on GitHub Pages.
  base: './',
  server: {
    fs: {
      // Allow importing wasm-pack output from ../pkg.
      allow: [path.resolve(dirname, '..')]
    }
  }
});
