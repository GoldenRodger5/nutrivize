import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React 17 compatibility mode
      jsxRuntime: 'classic',
      // Don't use React 18 features
      fastRefresh: true,
    })
  ],
  resolve: {
    alias: {
      // Ensure correct React DOM import
      'react-dom/client': 'react-dom'
    }
  },
  server: {
    // Use the original port from the startup script
    proxy: {
      '/user': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
}) 