import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cpSync } from 'fs';

function copyPublicPlugin() {
  return {
    name: 'copy-public',
    closeBundle() {
      try {
        cpSync(resolve(__dirname, 'public'), resolve(__dirname, 'dist'), { recursive: true });
      } catch (e) { console.error('[copy-public]', e); }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyPublicPlugin()],
  root: 'src',
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'src/newtab/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        blocked: resolve(__dirname, 'src/blocked/index.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (c) => {
          if (c.name === 'service-worker') return 'service-worker.js';
          if (c.name === 'newtab') return 'newtab/index.js';
          if (c.name === 'popup') return 'popup/index.js';
          if (c.name === 'blocked') return 'blocked/index.js';
          return '[name]/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  define: { 'process.env.NODE_ENV': '"production"' },
});
