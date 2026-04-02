import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // Required: expose server to Docker network & host machine
    port: 5173,
    watch: {
      usePolling: true, // Required: Windows file-system polling for live reload inside Docker
    },
    hmr: {
      port: 5173,       // Hot Module Replacement on same port
    },
  },
})
