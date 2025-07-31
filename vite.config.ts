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
          analytics: ['@vercel/analytics/react', '@vercel/speed-insights/react']
        }
      }
    },
    // Enable minification (esbuild is default and faster than terser)
    minify: 'esbuild',
    target: 'es2015',
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production for security
    chunkSizeWarningLimit: 1000
  },
  // Enable compression
  server: {
    headers: {
      'Cache-Control': 'max-age=31536000'
    }
  }
})