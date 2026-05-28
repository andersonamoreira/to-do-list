import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'test-super-secret-jwt-key-for-testing',
      JWT_EXPIRES_IN: '1h',
      PORT: '0',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
      },
    },
  },
})
