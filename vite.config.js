import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is /tide-testing/ on GitHub Pages, / everywhere else
const base = process.env.GITHUB_ACTIONS ? '/tide-testing/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
