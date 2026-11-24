import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Props that carry text a visitor sees or a screen reader announces (DOM attributes and this
// repo's own components' text props).
const TEXT_PROP = 'JSXAttribute[name.name=/^(alt|title|placeholder|label|aria-label|aria-description|aria-roledescription|aria-valuetext|aria-placeholder|badge|subtitle|heading|eyebrow|caption|tooltip|description)$/]'
const HAS_LETTER = '[value=/[A-Za-z]/]'
const CMS_MESSAGE = 'Visible text must come from content/*.yaml (data.*, common.*, ui.*), not code. See the cms-integrity skill.'
const CMS_TEXT_SELECTORS = [
  `${TEXT_PROP} > Literal${HAS_LETTER}`,
  `${TEXT_PROP} > JSXExpressionContainer > Literal${HAS_LETTER}`,
  `${TEXT_PROP} > JSXExpressionContainer :matches(ConditionalExpression, LogicalExpression, BinaryExpression[operator='+']) > Literal${HAS_LETTER}`,
  `${TEXT_PROP} > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/[A-Za-z]/]`,
  `:matches(JSXElement, JSXFragment) > JSXExpressionContainer > Literal${HAS_LETTER}`,
  `:matches(JSXElement, JSXFragment) > JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression, BinaryExpression[operator='+']) > Literal${HAS_LETTER}`,
  `:matches(JSXElement, JSXFragment) > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/[A-Za-z]/]`,
].map(selector => ({ selector, message: CMS_MESSAGE }))

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
      // What jsx-no-literals can't see (it ignores props and {'…'} text): a word typed into a
      // text prop (alt, aria-label, title, placeholder, label, …) or into JSX text as a JS string
      // or template literal. Strings with no letter (alt="", ": ") are allowed. Tested in
      // src/test/scripts/cmsGuard.test.js.
      'no-restricted-syntax': ['error', ...CMS_TEXT_SELECTORS],
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
