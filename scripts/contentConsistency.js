// scripts/contentConsistency.js
// Pure detection logic for `npm run content:validate`: the e-mail address and
// the lives-impacted total must be the same everywhere in content/, and must
// equal the single source of truth in content/shared/site.yaml.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

// A total like "50,000+", "50500+" or "40,000+" (5 digits, optional comma, plus).
const TOTAL_RE = /\b\d{2},?\d{3}\+/g

// A total only counts as the lives/people figure when it sits in the same
// sentence as one of these words. This is what lets a different metric
// ("reaching 15,000+ students") through without an allow-list of numbers.
const LIVES_WORDS_RE = /\b(lives|people|impacted|changed)\b/i

// Bare values like value: "50,000+" carry their meaning in a sibling field
// (label: "Lives impacted"). Only strings this short are checked via siblings.
const BARE_VALUE_MAX = 12

export const normalizeTotal = (s) => s.replace(/,/g, '')

export function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean)
}

export function findEmails(text) {
  return [...text.matchAll(EMAIL_RE)].map((m) => m[0])
}

// Returns each total in `text` that is attached to lives/people wording.
// `siblingText` is the joined text of the other string fields of the same YAML
// object, consulted only when the string is just a bare number.
export function findLivesTotals(text, siblingText = '') {
  const found = []
  for (const sentence of splitSentences(text)) {
    const totals = sentence.match(TOTAL_RE)
    if (!totals) continue
    const bare = sentence.trim().length <= BARE_VALUE_MAX
    const context = bare ? `${sentence} ${siblingText}` : sentence
    if (LIVES_WORDS_RE.test(context)) found.push(...totals)
  }
  return found
}

// Yields { text, siblingText, where } for every string in a parsed YAML value.
export function* stringsOf(node, where = '') {
  if (typeof node === 'string') {
    yield { text: node, siblingText: '', where }
  } else if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* stringsOf(node[i], `${where}[${i}]`)
  } else if (node && typeof node === 'object') {
    const siblingText = Object.values(node).filter((v) => typeof v === 'string').join(' ')
    for (const [k, v] of Object.entries(node)) {
      const here = where ? `${where}.${k}` : k
      if (typeof v === 'string') yield { text: v, siblingText, where: here }
      else yield* stringsOf(v, here)
    }
  }
}

// docs: [{ file, data }] (parsed YAML) and/or [{ file, text }] (plain text,
// e.g. the llms.txt template). Returns a list of { file, message } errors.
export function checkConsistency(site, docs) {
  const errors = []
  const wantEmail = site.email.trim().toLowerCase()
  const wantTotal = normalizeTotal(site.livesImpacted)

  for (const doc of docs) {
    const items = doc.data !== undefined
      ? [...stringsOf(doc.data)]
      : [{ text: doc.text, siblingText: '', where: '' }]
    for (const { text, siblingText, where } of items) {
      const at = where ? ` (${where})` : ''
      for (const email of findEmails(text)) {
        if (email.toLowerCase() !== wantEmail) {
          errors.push({ file: doc.file, message: `e-mail "${email}"${at} differs from site.yaml email "${site.email}"` })
        }
      }
      for (const total of findLivesTotals(text, siblingText)) {
        if (normalizeTotal(total) !== wantTotal) {
          errors.push({ file: doc.file, message: `lives total "${total}"${at} differs from site.yaml livesImpacted "${site.livesImpacted}"` })
        }
      }
    }
  }
  return errors
}
