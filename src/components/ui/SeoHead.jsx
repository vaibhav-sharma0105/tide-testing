import { Helmet } from 'react-helmet-async'

// The intended production domain — this is a rebuild of the live
// tideinternational.org site, not a placeholder. Canonical/OG/breadcrumb URLs
// point here even though the current build is served from GitHub Pages.
const SITE_URL = 'https://tideinternational.org'

// Unlike canonical/og:url (pointers of intent), og:image is actually FETCHED
// by social crawlers the moment a link is shared — it must resolve to
// something real today, not to a domain that isn't serving this content yet.
// BASE_URL is '/tide-testing/' on GitHub Pages, '/' locally — same pattern
// vite.config.js already uses, so this is automatically correct wherever the
// build is actually deployed, with no change needed after a future domain cutover.
const DEFAULT_OG_IMAGE_PATH = `${import.meta.env.BASE_URL}assets/images/shared/tide-logo.png`

/**
 * Shared per-page <head> content: title, description, canonical, OG/Twitter
 * tags, and an optional BreadcrumbList JSON-LD block.
 *
 * breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'About Us' }, ...]
 *   — paths are resolved against SITE_URL, not the current origin. `path` is
 *   optional per-item: an intermediate label with no standalone page of its
 *   own (e.g. a nav dropdown heading like "About Us") just omits `item`,
 *   which is valid schema.org BreadcrumbList usage.
 */
export default function SeoHead({ title, description, path, breadcrumbs, noindex = false, ogImagePath }) {
  const url = `${SITE_URL}${path}`
  const ogImage = ogImagePath
    ? `${window.location.origin}${ogImagePath}`
    : `${window.location.origin}${DEFAULT_OG_IMAGE_PATH}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            ...(b.path ? { item: `${SITE_URL}${b.path}` } : {}),
          })),
        })}</script>
      )}
    </Helmet>
  )
}
