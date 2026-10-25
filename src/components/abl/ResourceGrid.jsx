import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react'
import ResourceCard from './ResourceCard'
import rcData from '../../data/abl-resource-center.json'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-tide-border overflow-hidden animate-pulse">
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-body font-semibold hover:bg-primary/90 transition-colors"
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
      {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
    </div>
  )
}
