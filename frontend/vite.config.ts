import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: 'localhost',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Manual chunks para optimizar bundle size
        manualChunks: {
          // Material-UI core (el más pesado ~500KB)
          'mui-core': [
            '@mui/material',
            '@mui/system',
            '@mui/utils',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Material-UI icons (~300KB)
          'mui-icons': ['@mui/icons-material'],
          // Material-UI extra components
          'mui-lab': ['@mui/lab', '@mui/x-date-pickers'],
          // Vendor core (React, Router, Redux)
          'vendor-core': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // Redux ecosystem
          'redux': [
            '@reduxjs/toolkit',
            'react-redux',
          ],
          // Form handling
          'forms': [
            'react-hook-form',
            'yup',
            '@hookform/resolvers',
          ],
          // Utils y otros
          'vendor-utils': [
            'axios',
            'react-toastify',
            'date-fns',
          ],
        },
        // Nombres de archivos con hash para cache busting
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name].[hash].js`;
        },
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // Aumentar el límite de advertencia de chunk size (por MUI)
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});