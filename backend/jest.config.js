module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testMatch: [
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/**/__tests__/**/*.{js,jsx}',
  ],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'server-modular.js',
    '!tests/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!prisma/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true,
  testTimeout: 30000, // Aumentado a 30 segundos para conexiones BD
  forceExit: true, // Forzar salida después de tests
  detectOpenHandles: true, // Detectar handles abiertos para debugging
  maxWorkers: 1, // Ejecutar tests secuencialmente para evitar conflictos BD
};