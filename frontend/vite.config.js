import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('recharts') || id.includes('chart.js')) {
            return 'charts'
          }

          if (id.includes('@dnd-kit')) {
            return 'dnd'
          }
        },
      },
    },
  },
})
