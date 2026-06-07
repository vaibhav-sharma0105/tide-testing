import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.GITHUB_ACTIONS ? '/tide-testing/' : '/'

// Warn at build time if critical secrets are missing on CI
if (process.env.GITHUB_ACTIONS && !process.env.VITE_ABL_API_URL) {
  console.warn('\n⚠  VITE_ABL_API_URL is not set — Pramaan section will show "API not configured" on the deployed site.\n   Add it as a GitHub Actions repository secret.\n')
}

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react'
          if (id.includes('node_modules/react-router')) return 'vendor-router'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'vendor-i18n'
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-helmet-async')) return 'vendor-ui'
        },
      },
    },
  },
})
