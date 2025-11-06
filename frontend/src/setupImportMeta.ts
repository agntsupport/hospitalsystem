// ABOUTME: Setup file to define import.meta for Jest tests
// ABOUTME: Jest doesn't natively support import.meta, so we need to define it globally before any imports

// Define import.meta globally for Jest
(global as any).import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3001/api',
      MODE: 'test',
      DEV: false,
      PROD: false,
    },
  },
};
