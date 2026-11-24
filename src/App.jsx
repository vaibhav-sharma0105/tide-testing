import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { Suspense } from 'react'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import CreativeLoader from './components/ui/CreativeLoader'
import { useDelayedVisible } from './hooks/useDelayedVisible'
// The route table and the lazy-loaded pages (lazyPage: reload once on a stale chunk; preload()).
import { ROUTES } from './routes'

/* Suspense renders this the instant a lazy route suspends, and unmounts it
   the instant the import resolves — useDelayedVisible(true, ...) means it
   only actually shows anything if that window lasts longer than the delay,
   so a fast chunk load never flashes the loader at all. */
function RouteLoadingFallback() {
  const show = useDelayedVisible(true, 200)
  return (
    <div className="min-h-screen flex items-center justify-center bg-tide-bg">
      {show && <CreativeLoader />}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <HelmetProvider>
      {/* reducedMotion="user" makes every motion.* animation in the app
          respect the OS-level prefers-reduced-motion setting automatically —
          the CSS media query in index.css only covers actual CSS animations/
          transitions, not Framer Motion's JS-driven ones, which is everything
          used throughout this site (motion.div, whileInView, etc). */}
      <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {ROUTES.map(([path, Page]) => <Route key={path} path={path} element={<Page />} />)}
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
      </MotionConfig>
    </HelmetProvider>
    </ErrorBoundary>
  )
}
