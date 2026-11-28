import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // A page test that is first to import a page transforms its whole module tree; on a busy machine
    // (CI, or several runs at once) that passed the 5 s default and failed tests at random
    // (audit 2026-11-28). The checks themselves are unchanged.
    testTimeout: 30000,
    include: ['src/test/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/main.jsx'],
    },
  },
})
