import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Configurazione per gli assets
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    minify: true,
    // Sourcemaps solo in sviluppo
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Configurazione rollup per output consistente
    rollupOptions: {
      output: {
        // File JS principale
        entryFileNames: 'scrivania-app.js',
        
        // Chunks separati (se necessari)
        chunkFileNames: 'scrivania-chunk-[name].js',
        
        // Assets (immagini, CSS, fonts)
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          // Organizza gli assets per tipo
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `${ext}/[name].[ext]`;
          }
          if (/css/i.test(ext)) {
            return 'css/[name].[ext]';
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'fonts/[name].[ext]';
          }
          
          // Default per altri tipi
          return '[name].[ext]';
        }
      }
    },
    
    // Configurazione per copiare gli assets
    assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.svg']
  },
  
  // Configurazione per il server di sviluppo
  server: {
    port: 5173,
    host: true, // Permette connessioni esterne
    
    // Proxy per le API WordPress durante lo sviluppo
    proxy: {
      '/wp-json': {
        target: 'https://innerplaytools-dev.it',
        changeOrigin: true,
        secure: true
      },
      '/wp-content': {
        target: 'https://innerplaytools-dev.it',
        changeOrigin: true,
        secure: true
      }
    }
  },
  
  // Alias per import più puliti
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@assets': resolve(__dirname, './public/assets')
    }
  },
  
  // Definizioni globali
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Definisce se siamo in produzione WordPress
    '__WORDPRESS_ENV__': JSON.stringify(process.env.NODE_ENV === 'production')
  },
  
  // Ottimizzazioni
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/modifiers',
      'pusher-js'
    ]
  }
})