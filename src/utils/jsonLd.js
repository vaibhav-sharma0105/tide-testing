// JSON-LD text for a <script type="application/ld+json"> element.
//
// Why this matters here: the build saves every page as HTML (scripts/prerender.mjs), and a browser
// writes the text inside <script> out exactly as it is — so a Sheet title containing "</script>"
// would end the element early and the rest would run as page code on the live site. "<", ">" and "&"
// are therefore written as JSON \u escapes, which read back as the same characters. Use this for
// every JSON-LD block (scripts/siteDataPlugin.js does the same for the site-wide blocks).
export function jsonLdText(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
