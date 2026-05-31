import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.tsx', 'src/background/service-worker.ts'],
    },
  },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
