import { defineConfig } from 'vite';

export default defineConfig({
  // Hosted at sumitnarang.com/jev, so built asset URLs need that prefix.
  base: '/jev/',
  server: {
    port: 5180,
    proxy: { '/jev/api': 'http://127.0.0.1:8787' },
  },
});
