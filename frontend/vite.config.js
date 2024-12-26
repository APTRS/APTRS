import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  optimizeDeps: {
    //include: ['@workspace/ckeditor5'],
  },
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
            if (id.includes('ckeditor5')) {
              return 'ckeditor5';
            }
            if (id.includes('react')) {
              return 'react';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
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
})
