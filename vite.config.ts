import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/frierdiker-rebbe-timeline/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
