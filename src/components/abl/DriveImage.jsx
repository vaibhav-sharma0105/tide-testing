import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { getAblThumbnail } from '../../utils/ablThumbnails'

export default function DriveImage({ id, alt, className = '', variant = 'thumb', imgClassName = '' }) {
  const [loaded,  setLoaded]  = useState(false)
  const [errored, setErrored] = useState(false)
  const src = getAblThumbnail(id, variant)

  return (
    <div className={`relative aspect-[3/4] overflow-hidden bg-tide-subtle ${className}`}>
      {/* Pulse shimmer while loading */}
      {!loaded && !errored && src && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-tide-subtle via-white/80 to-tide-subtle" />
      )}

      {(!src || errored) ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-primary/8 to-primary/20 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary/25" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  )
}
