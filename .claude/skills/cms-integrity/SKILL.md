---
name: cms-integrity
description: >
  TRIGGER — invoke this automatically, without being asked, whenever you are about to add or
  edit a page component, a UI component that renders user-facing copy, or any JSX that shows
  text or an image to a site visitor on this project. Also trigger immediately after writing
  such code, before reporting the task done. The failure mode this catches: a string or image
  path typed directly into JSX bypasses the YAML→JSON CMS pipeline entirely, so a non-technical
  editor following CONTENT-GUIDE.md cannot change it — the page silently becomes partially
  uneditable, and nothing in lint/build/tests catches this, because hardcoded JSX text is
  perfectly valid React. A 2026-06-21 audit of all 24 pages found 22 real instances of this
  across 14 files, including one case (Publications.jsx's type-label map) that looked
  structurally identical to an adjacent, *correctly* code-only map (icon/color lookups) but
  wasn't — plain text has no non-serializable reason to live in code, unlike a JSX icon
  element or a Tailwind class string.
  SKIP for: the ABL/Pramaan subsystem's resource data itself (title, description, grade, etc. —
  that legitimately comes live from the Apps Script API, not YAML, by design), CSS class names,
  internal route paths (`to="/contact"` is code, not content, per this project's convention),
  console/log strings, code comments, and single generic icon-button aria-labels like "Close"
  where the icon already conveys the action unambiguously.
---

# CMS Integrity — Every Visible String and Image Goes Through the Pipeline

## Why this exists

This site's entire value proposition for its non-technical maintainers is `content/*.yaml` →
`npm run content:sync` → `src/data/*.json` → React renders it. The moment a developer (or an
agent) writes `<h2>Some Heading</h2>` instead of `<h2>{data.section.heading}</h2>`, that promise
breaks for that one piece of content — invisibly. There's no error, no failing test, no visual
difference at all. The only way it surfaces is a future site editor opening `content/pages/x.yaml`,
searching for the text they want to change, not finding it, and concluding either that the CMS
is broken or that they need a developer for something that should be self-serve. By then the
connection between "this string" and "that JSX file" has been forgotten by everyone.

## Scope

**In scope:** any new or edited file under `src/pages/**` or `src/components/**` (except the
four `Abl*.jsx` pages, whose resource data is API-driven by design) that renders visible text,
`alt` attributes, or image/media paths to an end user.

**Out of scope:** the live ABL/Pramaan resource data itself, route paths, CSS, code comments,
test files, and the loader/404/Coming-Soon components' own internals once they're already
correctly wired (verify they're *used* correctly, don't re-litigate their existing wiring).

## Procedure

1. **Before writing new JSX, check whether the page already imports its data file.** Pattern:
   `import data from '../data/<page-name>.json'`. If you're adding a new page, the YAML→JSON
   sync auto-discovers any new file dropped into `content/pages/` or `content/shared/` — no
   registration step needed (confirmed by reading `scripts/yaml-to-json.js`: it walks both
   directories recursively). Create the matching `content/pages/<name>.yaml` (or
   `content/shared/<name>.yaml` for cross-page chrome) alongside the component, not after.

2. **For every literal string in your JSX that a visitor would read, ask: does this come from
   `data.xxx`?** If not, it's a violation unless it matches one of the SKIP categories above.
   Two established, correct patterns to choose between:
   - **Page-specific content** → add a field to that page's YAML, import via `data.section.field`.
   - **Reusable micro-copy used identically across multiple pages** (a caption, a generic
     button label, an aria-label) → use the existing `common.*` i18n namespace via
     `t('common.key', 'English fallback')`, **no JSON import needed** — this is the
     established pattern (see `OurTeam.jsx`'s `common.hoverForBio` for a working example).
     Check `content/locales/{hi,gu}/shared.yaml`'s `common:` block for an existing key before
     adding a new one; duplicated near-identical English strings across files (e.g. five
     copies of "Click any image to view full screen.") are a sign one should have been shared
     from the start.

3. **For every `<img>`/media element, check both `src` and `alt`.** A `src={imgSrc(data.x.photo)}`
   with a hardcoded `alt="Some description"` is a partial violation — the path is editable, the
   description isn't. Add a matching `data.x.photoAlt` field. Exception: `alt=""` on a purely
   decorative image (one with no informational content, e.g. a background texture) is correct
   accessibility practice, not a bug — leave it.

4. **Before adding a brand-new i18n key, grep for an existing one that already says the same
   thing**, especially under `common:` and the page's own namespace (e.g. `abl.resourceCenter.*`).
   This audit found multiple cases where a translation key already existed in
   `content/locales/{hi,gu}/*.yaml` but the component never actually called `t()` for it — the
   translation work had been done and then silently orphaned. Wire to the existing key instead
   of creating a duplicate.

5. **When you add a YAML field, add it to all three: the English source YAML, AND check whether
   a `t()` call needs matching `hi`/`gu` keys.** If the page already has *any* existing `t()`
   calls in an established namespace (e.g. `projects.sdgDrives.*`), match that namespace for
   consistency rather than leaving your new field translation-less while siblings on the same
   page are translated. If a page has *no* existing i18n wiring at all, matching that page's own
   precedent (YAML-only, no `t()`) is acceptable — don't unilaterally introduce i18n to an
   otherwise-untranslated page as a side effect of an unrelated fix.

6. **Verify, don't assume:** run `npm run content:sync` and confirm the new JSON file/field
   appears as expected, then `npm run lint` and `npm run build`. Spot-check the rendered page
   (dev server + screenshot, or Playwright) for at least the specific element you changed — a
   missing or misspelled YAML key fails silently as `undefined` in JSX, not as a build error.

7. **If you find an unrelated existing violation while in a file for another reason, fix it and
   call it out separately** — same standing project convention as `doc-sync`.

## Quick self-check grep (run before considering a page "done")

```bash
# Multi-word hardcoded text directly between JSX tags (excluding Abl* API pages)
grep -nE '>[A-Z][a-zA-Z]+( [a-zA-Z]+){1,}<' src/pages/<file>.jsx

# Hardcoded, non-empty alt text
grep -n 'alt="[A-Za-z]' src/pages/<file>.jsx
```
Neither is exhaustive (multi-line JSX text, template literals, and conditional ternaries inside
`{}` won't match) — they're a fast first pass, not a substitute for reading the file.

## Reference case: the 2026-06-21 full-site audit

A worked example exists in this repo's git history (commit around `1c80ca5`). An Explore agent
surveyed all 24 pages and reported 22 findings across 8 files; manual verification against the
actual code confirmed most, **caught one false positive** (`PublicationsCombined.jsx` already
used the correct `t()` pattern — the agent mischaracterized working code as broken), and an
independent grep sweep afterward found **11 additional real violations the agent's read-through
missed entirely** (8 hardcoded `alt` attributes, 3 instances in `src/components/abl/*` — outside
the page-only scope the agent was given). Lesson encoded into this skill: a single survey pass,
even a thorough one, is not sufficient — verify findings before fixing them, and always run an
independent pattern-based sweep afterward to catch what a read-through missed.
