import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router-dom)[\/]/.test(id) || /\.pnpm\/(react|react-dom|react-router-dom)@/.test(id)) {
            return 'vendor'
          }
          if (/node_modules\/@tanstack\/(react-query|react-table|react-virtual)[\/]/.test(id) || /\.pnpm\/@tanstack\+(react-query|react-table|react-virtual)@/.test(id)) {
            return 'query'
          }
          if (/node_modules\/@radix-ui\/react-[a-z]/.test(id) || /\.pnpm\/@radix-ui\+react-[a-z]/.test(id)) {
            return 'ui'
          }
        },
      },
    },
  },
})