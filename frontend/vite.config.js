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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@open-ish') || id.includes('tslib')) {
              return '@open-ish';
            }
            
            if (id.includes('ckeditor5')) {
              return 'ckeditor5';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            // Add more conditions here to split other large dependencies
            return 'vendor';
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
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    silent: true,
    setupFiles: ['./tests/setup.ts']
  }
});