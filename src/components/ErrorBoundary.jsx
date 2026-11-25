import { Component } from 'react'
import data from '../data/error.json'

/* Catches render errors anywhere below it and shows a friendly screen.
   It sits outside <BrowserRouter>, so the home link is a plain <a> rather
   than a <Link>. The error itself is logged to the console for developers;
   visitors never see the message or stack — only a dev build (import.meta.env.DEV)
   appends them below the friendly text.
   `inline` (P5): the same screen as a <div> for use inside the page's <main> — Layout wraps each
   page in one (keyed by address), so a crash in one page keeps the header and footer, and moving to
   another page clears it. The outer boundary in App.jsx still catches anything outside a page. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const Wrapper = this.props.inline ? 'div' : 'main'

    return (
      <Wrapper className={`${this.props.inline ? 'min-h-[60vh] pt-28' : 'min-h-screen'} flex items-center justify-center bg-tide-bg px-4 py-16`}>
        <div role="alert" className="max-w-lg w-full text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-tide-text mb-4">
            {data.heading}
          </h1>
          <p className="font-body text-tide-muted leading-relaxed mb-8 max-w-md mx-auto">
            {data.body}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center px-5 rounded-full font-body font-semibold text-sm gradient-accent text-tide-text shadow-sm hover:shadow-glow-amber transition-all duration-200"
            >
              {data.reloadLabel}
            </button>
            <a
              href={import.meta.env.BASE_URL}
              className="inline-flex min-h-11 items-center justify-center px-5 rounded-full font-body font-semibold text-sm border-2 border-primary text-primary-dark hover:bg-primary-dark hover:text-white transition-colors duration-200"
            >
              {data.homeLabel}
            </a>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-10 text-left text-xs whitespace-pre-wrap break-words bg-red-50 text-red-800 border border-red-200 rounded-lg p-4 overflow-auto">
              {error?.message}{'\n\n'}{error?.stack}
            </pre>
          )}
        </div>
      </Wrapper>
    )
  }
}
