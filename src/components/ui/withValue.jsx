// Used by HeroStats and the Publications hero.
// "{n} publications" → ['', <strong>12</strong>, ' publications']: the number is set in white, the
// words stay muted.
export default function withValue(template, token, value) {
  const [before, after = ''] = template.split(`{${token}}`)
  return (
    <>
      {before}
      <strong className="font-semibold text-white tabular-nums">{value}</strong>
      {after}
    </>
  )
}
