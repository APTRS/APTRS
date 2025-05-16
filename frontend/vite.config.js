import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      exclude: ['ckeditor5-custom-build']
    },
    sourcemap: false,
    // Increase the warning limit to reduce unnecessary warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into chunks
          if (id.includes('node_modules')) {
            
            
            if (id.includes('ckeditor5')) {
              return 'ckeditor5';
            }
            
            if (id.includes('axios')) {
              return 'axios';
            }
          }
          
          // Split application code into logical modules
          if (id.includes('/src/lib/data/')) {
            return 'app-data';
          }
          if (id.includes('/src/components/')) {
            return 'app-components';
          }
          if (id.includes('/src/pages/')) {
            return 'app-pages';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    visualizer({
      filename: './dist/stats.html',
      open: false, // Automatically open the visualization in your default browser
      gzipSize: true, // Show gzipped sizes
    }),
  ],
  server: {
    allowedHosts: ['aptrs.anof.home'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    silent: true,
    setupFiles: ['./tests/setup.ts']
  }
});