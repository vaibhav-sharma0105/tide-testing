import { useState } from 'react'

// A self-hosted thumbnail that fades in once loaded (instantly under reduced motion). Width and
// height come from the manifest so the box is reserved before it loads (no layout shift).
// srcSet/sizes (optional) let high-resolution screens pick a larger file.
// Decorative (alt=""): the publication's title is always printed beside it. Opted out of the
// site-wide placeholder swap (data-no-placeholder); onError lets the caller show a stand-in.
export default function FadeImage({ src, srcSet, sizes, width, height, priority = false, onError, className = '' }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      ref={el => { if (el?.complete && el.naturalWidth > 0) setLoaded(true) }}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={width}
      height={height}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      data-no-placeholder
      onLoad={() => setLoaded(true)}
      onError={onError}
      className={`transition-opacity duration-500 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
