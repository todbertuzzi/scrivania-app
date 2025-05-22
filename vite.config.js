import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  base: '/wp-content/plugins/scrivania-collaborativa-api/js/app/assets/',
  build: {
    outDir: 'dist',
    minify: true,
    // Enable sourcemaps for debugging
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        entryFileNames: 'scrivania-app.js',
        chunkFileNames: 'scrivania-chunk-[name].js',
        assetFileNames: 'scrivania-assets/[name].[ext]'
      }
    }
  },
  // Allow for debugging
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
