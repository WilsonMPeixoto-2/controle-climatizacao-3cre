import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Compiler: memoização automática (alvo React 19)
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    checker({
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint .',
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Separa vendors de longa duração para cachearem entre deploys.
        // Vite 8/Rolldown exige manualChunks como função (não objeto).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase-vendor'
          if (id.includes('leaflet')) return 'leaflet-vendor'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
})
