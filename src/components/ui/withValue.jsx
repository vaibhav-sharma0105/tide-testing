// Used by HeroStats and the Publications hero.
// "{n} publications" → ['', <strong>12</strong>, ' publications']: the number is set in white, the
// words stay muted.
// `strongClass` (optional) replaces the number's colour classes (default: white, for dark banners).
export default function withValue(template, token, value, strongClass = 'text-white') {
  const [before, after = ''] = template.split(`{${token}}`)
  return (
    <>
      {before}
      <strong className={`font-semibold tabular-nums ${strongClass}`}>{value}</strong>
      {after}
    </>
  )
}
