import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  // Use relative asset paths so dist can be hosted under /simulator on GitHub Pages.
  base: './',
  server: {
    fs: {
      // Allow importing wasm-pack output from ../pkg.
      allow: [path.resolve(__dirname, '..')]
    }
  }
});
