// Render-time checks for links and embeds that come from the Sheet snapshots (anyone can type them
// into a Form). The sync already refuses anything but http(s) links at ingest
// (scripts/lib/snapshot-core.js isHttpUrl); these are the second, independent check, so a bad value
// that reaches a snapshot some other way still can't become a javascript:/data: link or an
// unexpected frame. Tested in src/test/scripts/securitySanitizers.test.js.

/** An absolute http(s) link to a named host with no user name/password, trimmed — otherwise null. */
export function safeHttpUrl(url) {
  if (typeof url !== 'string') return null
  const s = url.trim()
  // eslint-disable-next-line no-control-regex
  if (!s || /[\s\u0000-\u001F\u007F]/.test(s)) return null
  let u
  try { u = new URL(s) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (u.username || u.password || !u.hostname.includes('.')) return null
  return s
}

// The only players the video overlay may frame (they are also the CSP frame-src hosts that serve video).
const EMBED_PATTERNS = [
  /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{10,}\/preview$/,
  /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{6,20}(\?[A-Za-z0-9=&_-]*)?$/,
  /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{6,20}(\?[A-Za-z0-9=&_-]*)?$/,
]

/** The URL if it is a Drive preview or YouTube embed player address; otherwise null. */
export function safeEmbedUrl(url) {
  return typeof url === 'string' && EMBED_PATTERNS.some((re) => re.test(url)) ? url : null
}
