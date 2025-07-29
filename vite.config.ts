import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable gzip compression
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          analytics: ['@vercel/analytics/react']
        }
      }
    },
    // Enable minification (esbuild is default and faster than terser)
    minify: 'esbuild'
  },
  // Enable compression
  server: {
    headers: {
      'Cache-Control': 'max-age=31536000'
    }
  }
})