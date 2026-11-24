// The CMS lint guard (eslint.config.js): visible text typed into JSX — as a text prop, a JS string
// or a template literal — fails `npm run lint`; text read from YAML and strings with no letter pass.
import { describe, it, expect, beforeAll } from 'vitest'
import { ESLint } from 'eslint'

const eslint = new ESLint()
const CMS_RULES = new Set(['react/jsx-no-literals', 'no-restricted-syntax'])

async function cmsErrors(jsx, filePath = 'src/components/__cms_guard__.jsx') {
  const code = `import data from '../data/x.json'\nexport default function X({ a, b }) {\n  return (${jsx})\n}\n`
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter(m => CMS_RULES.has(m.ruleId))
}

describe('CMS lint guard', () => {
  // ESLint loads its config and plugins on the first call (seconds under a loaded machine, e.g. with
  // --coverage): do that once here, with room, so no single case hits the 5 s test timeout.
  beforeAll(() => cmsErrors('<p />'), 60000)

  it.each([
    ['bare JSX text', '<p>Hello world</p>'],
    ['alt literal', '<img src={a} alt="A child reading" />'],
    ['aria-label literal', '<button aria-label="Close menu" />'],
    ['aria-label in braces', "<button aria-label={'Close menu'} />"],
    ['title template literal', '<a href={a} title={`Open ${b}`} />'],
    ['placeholder fallback', "<input placeholder={a || 'Search resources'} />"],
    ['label ternary', "<X label={a ? 'Show more' : 'Show less'} />"],
    ['badge prop on a component', '<X badge="New" />'],
    ['string in JSX children', "<p>{'Loading'}</p>"],
    ['conditional string in children', "<p>{a ? 'Copied' : b}</p>"],
    ['logical string in children', "<p>{a && 'Nothing found'}</p>"],
    ['template literal in children', '<p>{`${a} results`}</p>'],
    ['concatenation in children', "<p>{a + ' results'}</p>"],
  ])('fails on %s', async (_, jsx) => {
    expect((await cmsErrors(jsx)).length).toBeGreaterThan(0)
  })

  it.each([
    ['text from YAML', '<p>{data.hero.title}</p>'],
    ['alt from YAML', '<img src={a} alt={data.hero.photoAlt} />'],
    ['decorative alt=""', '<img src={a} alt="" />'],
    ['punctuation joining YAML text', '<button aria-label={`${data.a}: ${b}`} />'],
    ['token filled in code', "<p>{data.countTemplate.replace('{count}', a)}</p>"],
    ['class names and other non-text props', '<div className="flex gap-2" role="status" aria-live="polite" id="main" />'],
    ['allowed glyph', '<span>{a} · {b}</span>'],
    ['newline string', "<pre>{a}{'\\n\\n'}{b}</pre>"],
  ])('passes %s', async (_, jsx) => {
    expect(await cmsErrors(jsx)).toEqual([])
  })

  it('applies to pages as well as components', async () => {
    expect((await cmsErrors('<img src={a} alt="Team photo" />', 'src/pages/__cms_guard__.jsx')).length).toBeGreaterThan(0)
  })
})
