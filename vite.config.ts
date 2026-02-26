import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        bypass: (req, res, proxyOptions) => {
          const url = req.url || '';
          if (url.includes('.ts') || url.includes('.tsx') || url.includes('.js') || url.includes('.css')) {
            return req.url;
          }
          return null;
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'echarts'],
          'vendor-utils': ['react-hook-form', 'zod', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
});
