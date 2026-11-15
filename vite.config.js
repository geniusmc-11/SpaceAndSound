import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/svs-api': {
        target: 'https://svs.gsfc.nasa.gov/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/svs-api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
