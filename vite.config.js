import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    minify: true,
    sourcemap: false, // Disabilita in produzione
    rollupOptions: {
      output: {
        entryFileNames: 'scrivania-app.js',
        chunkFileNames: 'scrivania-chunk-[name].js',
        assetFileNames: 'scrivania-assets/[name].[ext]'
      }
    }
  }
})