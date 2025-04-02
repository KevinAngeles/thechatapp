/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/redux-vite-apollo-chat',
  server:{
    open: true,
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5173,
    host: 'localhost',
  },
  preview:{
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5173,
    host: 'localhost',
  },
  plugins: [react()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  },
}));
