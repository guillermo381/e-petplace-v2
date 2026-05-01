/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.VITE_SENTRY_DSN
      ? [sentryVitePlugin({ authToken: process.env.SENTRY_AUTH_TOKEN, org: 'e-petplace', project: 'e-petplace-v2' })]
      : []),
  ],
  build: {
    outDir: 'dist',
    sourcemap: !!process.env.VITE_SENTRY_DSN,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          ionic:    ['@ionic/react', '@ionic/react-router', '@ionic/core'],
          supabase: ['@supabase/supabase-js'],
          vendor:   ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
