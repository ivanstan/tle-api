import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'static',
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})

