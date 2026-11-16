/**
 * Turns a video link from a Sheet into something the site can play in its video overlay.
 * Google Drive (…/file/d/<id>/… or …?id=<id>) → Drive preview player;
 * YouTube (watch?v=, youtu.be/, shorts/, embed/) → privacy-enhanced YouTube player.
 * Anything else returns null: show it as a plain "Watch video" link instead.
 */
export function getVideoEmbedUrl(url) {
  if (typeof url !== 'string') return null
  let u
  try { u = new URL(url) } catch { return null }
  const host = u.hostname.replace(/^www\.|^m\./, '')
  if (host === 'drive.google.com') {
    const id = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/)?.[1] ?? u.searchParams.get('id')
    return id && /^[a-zA-Z0-9_-]+$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null
  }
  let yt = null
  if (host === 'youtu.be') yt = u.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com') {
    yt = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null
  }
  return yt && /^[a-zA-Z0-9_-]{6,20}$/.test(yt) ? `https://www.youtube-nocookie.com/embed/${yt}` : null
}
