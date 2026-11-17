import { defineConfig } from 'vite';

// Relative asset paths: GitHub Pages serves the site from /schism/.
// The build goes to ../docs, which Pages publishes from the main branch.
export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0, outDir: '../docs', emptyOutDir: true },
});
