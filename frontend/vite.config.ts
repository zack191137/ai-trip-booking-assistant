import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    host: true, // Allow external connections
    open: true, // Open browser automatically
    proxy: {
      // Proxy API requests to backend on Digital Ocean
      '/api': {
        target: 'https://ai.zackz.net:3000',
        changeOrigin: true,
        secure: true,
      },
      // Proxy WebSocket connections
      '/socket.io': {
        target: 'wss://ai.zackz.net:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
