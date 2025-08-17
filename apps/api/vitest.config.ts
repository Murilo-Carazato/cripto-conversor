import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/globalSetup.ts'],
    globals: true,
    include: ['test/**/*.test.ts'],
    restoreMocks: true,
    clearMocks: true,
    passWithNoTests: true,
  },
});
