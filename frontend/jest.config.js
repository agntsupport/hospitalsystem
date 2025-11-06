export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/setupImportMeta.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3001/api',
        MODE: 'test',
        DEV: false,
        PROD: false,
      },
    },
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock constants FIRST (before @/ pattern) to catch all imports
    '^@/utils/constants$': '<rootDir>/src/utils/__mocks__/constants.ts',
    '^.*/utils/constants$': '<rootDir>/src/utils/__mocks__/constants.ts',
    '^@/utils/api$': '<rootDir>/src/utils/__mocks__/api.ts',
    '^@/hooks/useAuth$': '<rootDir>/src/hooks/__mocks__/useAuth.ts',
    '^@/services/posService$': '<rootDir>/src/services/__mocks__/posService.ts',
    '^@/services/billingService$': '<rootDir>/src/services/__mocks__/billingService.ts',
    // Generic @/ pattern LAST to not override specific mocks
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};