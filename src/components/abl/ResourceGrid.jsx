import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react'
import ResourceCard from './ResourceCard'
import rcData from '../../data/abl-resource-center.json'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-tide-border overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-tide-subtle" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-tide-subtle rounded-full" />
          <div className="h-5 w-16 bg-tide-subtle rounded-full" />
        </div>
        <div className="h-4 bg-tide-subtle rounded w-3/4" />
        <div className="h-3 bg-tide-subtle rounded w-1/2" />
        <div className="flex gap-1 mt-2">
          <div className="h-5 w-12 bg-tide-subtle rounded-full" />
          <div className="h-5 w-12 bg-tide-subtle rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function ResourceGrid({ resources, loading, error, onRetry, colsClassName }) {
  const gridCols = colsClassName ?? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'

  if (loading) {
    return (
      <div
        className={`grid ${gridCols} gap-5`}
        role="status"
        aria-busy="true"
        aria-label={rcData.grid.loadingLabel}
      >
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-accent-deeper" />
        <p className="font-body text-tide-muted max-w-sm">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-body font-semibold shadow-[0_2px_8px_rgba(30,107,170,0.32)] hover:brightness-110 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> {rcData.grid.retry}
        </button>
      </div>
    )
  }

  if (!resources.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <BookOpen className="w-10 h-10 text-tide-muted/40" />
        <p className="font-display text-xl font-semibold text-tide-text">{rcData.grid.noResults}</p>
        <p className="text-sm font-body text-tide-muted">{rcData.grid.noResultsHint}</p>
      </div>
    )
  }

  return (
    <div className={`grid ${gridCols} gap-5`}>
      {resources.map((r, i) => (
        // a short stagger as a page of cards arrives; capped so a full page never feels slow
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: [0.4, 0, 0.2, 1] }}
          className="flex"
        >
          <ResourceCard resource={r} />
        </motion.div>
      ))}
    </div>
  )
}
