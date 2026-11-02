import { Fragment } from 'react'

// Underlines the listed words in amber, like a highlighter pass over a lead sentence.
export default function Highlight({ text, words }) {
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'i'))
  return parts.map((part, i) =>
    words.some((w) => w.toLowerCase() === part.toLowerCase())
      ? <mark key={i} className="bg-transparent text-inherit font-semibold [background:linear-gradient(transparent_62%,rgba(245,158,11,0.38)_62%)]">{part}</mark>
      : <Fragment key={i}>{part}</Fragment>
  )
}
