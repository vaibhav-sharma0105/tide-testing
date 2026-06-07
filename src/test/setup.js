import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Stable mock fn for i18n.changeLanguage.
// Must use vi.hoisted so it's defined before vi.mock factories execute.
// Cannot export hoisted vars (ESM), so expose via globalThis instead.
const _hoisted = vi.hoisted(() => ({ changeLanguage: vi.fn() }))
globalThis.__viMocks = _hoisted

// framer-motion — ESM-safe pass-through components
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const TAGS = [
    'div', 'section', 'article', 'main', 'header', 'footer', 'nav',
    'ul', 'ol', 'li', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'button', 'form', 'input', 'textarea', 'figure', 'aside', 'iframe',
  ]
  const mkEl = (tag) =>
    React.forwardRef(({
      children, initial, animate, exit, transition, variants,
      whileInView, viewport, whileHover, whileTap, layout, layoutId,
      ...rest
    }, ref) => React.createElement(tag, { ...rest, ref }, children))

  const motion = Object.fromEntries(TAGS.map(t => [t, mkEl(t)]))
  return {
    motion,
    m: motion,
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useInView: () => [null, true],
    useScroll: () => ({
      scrollY: { get: () => 0, onChange: vi.fn(), clearListeners: vi.fn() },
      scrollYProgress: { get: () => 0, onChange: vi.fn(), clearListeners: vi.fn() },
    }),
    useTransform: () => ({ get: () => 0, onChange: vi.fn() }),
  }
})

// react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => null,
  HelmetProvider: ({ children }) => children,
}))

// react-i18next — changeLanguage is stable via the hoisted ref
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { changeLanguage: _hoisted.changeLanguage, language: 'en' },
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// IntersectionObserver — must be a class, not an arrow function
global.IntersectionObserver = class {
  constructor(cb) { this._cb = cb }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ResizeObserver
global.ResizeObserver = class {
  constructor(cb) { this._cb = cb }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.scrollTo = vi.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((q) => ({
    matches: false, media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.assign(import.meta.env, {
  VITE_ABL_API_URL: '',
  VITE_ABL_CONTRIBUTE_FORM_URL: '',
  BASE_URL: '/',
})

const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })
