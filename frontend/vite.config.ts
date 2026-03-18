import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Source map'leri production build'de gizle — kaynak kodu ifşa etme
    sourcemap: false,
    // chunk boyutu uyarısı için limit (framer-motion büyük olabilir)
    chunkSizeWarningLimit: 600,
  },
});
