import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  optimizeDeps: {
    //include: ['@workspace/ckeditor5'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      exclude: ['ckeditor5-custom-build']
    }
  },
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true, // Automatically open the visualization in your default browser
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    silent: true,
    setupFiles: ['./tests/setup.ts']
  }
})
