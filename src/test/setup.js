import '@testing-library/jest-dom'
import { vi } from 'vitest'

// framer-motion — ESM-safe pass-through components
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const TAGS = [
    'div', 'section', 'article', 'main', 'header', 'footer', 'nav',
    'ul', 'ol', 'li', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'button', 'form', 'input', 'textarea', 'figure', 'aside', 'iframe',
    'svg', 'g', 'path', 'rect', 'ellipse', 'line', 'circle',
  ]
  const mkEl = (tag) =>
    React.forwardRef(({
      children, initial, animate, exit, transition, variants,
      whileInView, viewport, whileHover, whileTap, onTap, layout, layoutId,
      ...rest
    }, ref) => React.createElement(tag, { ...rest, ref }, children))

  const motion = Object.fromEntries(TAGS.map(t => [t, mkEl(t)]))
  return {
    motion,
    m: motion,
    AnimatePresence: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useInView: () => [null, true],
    useReducedMotion: () => false,
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
