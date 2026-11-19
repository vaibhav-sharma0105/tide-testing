import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import siteDataPlugin from './scripts/siteDataPlugin.js'

const base = process.env.GITHUB_ACTIONS ? '/tide-testing/' : '/'

export default defineConfig({
  base,
  plugins: [react(), siteDataPlugin()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react'
          if (id.includes('node_modules/react-router')) return 'vendor-router'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-helmet-async')) return 'vendor-ui'
        },
      },
    },
  },
})
