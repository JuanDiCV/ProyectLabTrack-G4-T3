import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      // La cobertura unitaria se mide sobre la lógica de negocio pura.
      include: ['src/modules/**/*.service.ts', 'src/modules/**/*.schema.ts', 'src/shared/**/*.ts'],
      exclude: ['src/shared/prisma.ts', 'src/shared/env.ts', 'src/shared/mappers.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
