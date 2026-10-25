import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    // CMS guard: visible text must come from content/*.yaml (via data.*),
    // never be typed into JSX. Allowed: punctuation/glyphs that are not copy.
    files: ['src/pages/**/*.jsx', 'src/components/**/*.jsx'],
    rules: {
      'react/jsx-no-literals': ['error', {
        noStrings: false,
        ignoreProps: true,
        allowedStrings: ['—', '–', '·', '→', '↗', '…', '|', '/', '-', ':', '.', ',', '&', '+', '(', ')', '%', '"', "'", '“', '”', '’'],
      }],
    },
  },
  {
    files: ['vite.config.js', 'vitest.config.js', 'playwright.config.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['src/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', args: 'none' }],
      'react-refresh/only-export-components': 'off',
    },
  },
])
