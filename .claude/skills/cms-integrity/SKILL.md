---
name: cms-integrity
description: >
  TRIGGER — invoke this automatically, without being asked, whenever you are about to add or
  edit a page component, a UI component that renders user-facing copy, or any JSX that shows
  text or an image to a site visitor on this project. Also trigger immediately after writing
  such code, before reporting the task done. The failure mode this catches: a string or image
  path typed directly into JSX bypasses the YAML→JSON CMS pipeline entirely, so a non-technical
  editor following CONTENT-GUIDE.md cannot change it — the page silently becomes partially
  uneditable. Hardcoded JSX text is perfectly valid React, so the build and tests never catch
  it; `npm run lint` catches bare JSX text (react/jsx-no-literals is an error in
  src/pages and src/components) and, since 2026-11-24, words in text props (aria-label/alt/title…)
  and template-literal text in JSX, but NOT text built in plain JS away from the JSX, JSON-LD,
  a breadcrumb name or an image path — so this skill is still needed. A 2026-06-21 audit of
  all 24 pages (the site had more pages then) found 22 real instances of this across 14 files,
  including one case (a publications page's type-label map, since removed) that looked
  structurally identical to an adjacent,
  *correctly* code-only map (icon/color lookups) but wasn't — plain text has no non-serializable
  reason to live in code, unlike a JSX icon element or a Tailwind class string.
  SKIP for: the Pramaan Resource Centre's resource data itself (title, description, grade,
  etc. — that legitimately comes from the Sheet snapshot src/data/sheets/pramaan-library.json, not
  YAML, by design; the Pramaan UI chrome around it is NOT exempt, it lives in
  content/pages/abl-home.yaml, pramaan-library.yaml, abl-contribute.yaml), CSS class names,
  internal route paths (`to="/contact"` is code, not content, per this project's convention),
  console/log strings, and code comments.
---

# CMS Integrity — Every Visible String and Image Goes Through the Pipeline

## Why this exists

This site's entire value proposition for its non-technical maintainers is `content/*.yaml` →
`npm run content:sync` → `src/data/*.json` → React renders it. The moment a developer (or an
agent) writes `<h2>Some Heading</h2>` instead of `<h2>{data.section.heading}</h2>`, that promise
breaks for that one piece of content — invisibly. There's no build error, no failing test, no
visual difference at all (JSX text is caught by lint, but other literals still are not). The
only way it surfaces is a future site editor opening `content/pages/x.yaml`,
searching for the text they want to change, not finding it, and concluding either that the CMS
is broken or that they need a developer for something that should be self-serve. By then the
connection between "this string" and "that JSX file" has been forgotten by everyone.

The site is English only. There is no i18n layer (no `t()`, no `useTranslation`, no locale
files): a page reads its YAML-generated JSON directly, e.g. `{data.hero.title}`.

## Scope

**In scope:** any new or edited file under `src/pages/**` or `src/components/**` that renders
visible text, `alt` / `aria-label` / `title` / `placeholder` attributes, or image/media paths to
an end user. This includes the Pramaan pages, `src/components/abl/*` and `src/components/library/*`: their UI
chrome (headings, filter/sort/pagination/card labels, SEO titles, button text) is YAML-backed in
`content/pages/abl-home.yaml`, `pramaan-library.yaml` and `abl-contribute.yaml` (the photo/video
viewer labels in `content/shared/ui.yaml` `mediaLightbox.*`). SEO titles there use `{token}`
placeholders that the code fills in (`.replace('{token}', …)` or the `fill()` helper in
`PramaanLibraryDetail.jsx`).

**Out of scope:** the Pramaan *resource data* itself (name, description, grades,
chapters… from the Sheet snapshot), route paths, CSS, code comments, test files, and the
loader/404/Coming-Soon/error-screen components' own internals once they're already correctly
wired (verify they're *used* correctly, don't re-litigate their existing wiring).

## First line of defense: the lint guard

`eslint.config.js` sets `react/jsx-no-literals` to **error** for `src/pages/**/*.jsx` and
`src/components/**/*.jsx` (`ignoreProps: true`; only punctuation/glyphs such as `— – · → ↗ … | / -
: . , & + ( ) %` and quote characters are allowed as bare text). So visible text typed between JSX
tags fails `npm run lint`. CI also runs lint (a failure stops the deploy), but run it
yourself before reporting done. Since 2026-11-24 a second rule in the same block
(`no-restricted-syntax`, `CMS_TEXT_SELECTORS`) also fails on a word typed into a text prop
(`alt`, `aria-label`, `title`, `placeholder`, `label`, `badge`, `heading`, `description`, …) or
into JSX children as `{'…'}`, a ternary/`||`/`&&`/`+` branch or a template literal
(`src/test/scripts/cmsGuard.test.js`). Neither rule sees: other string attributes, strings built
in plain JS away from the JSX, JSON-LD / breadcrumb names, or image paths — those still need the
checklist below. Don't silence the rule with `eslint-disable`; move the text to YAML instead.

## Checklist (what to verify for every change)

1. **JSX text** — every visitor-readable string between tags comes from `data.*` (page JSON),
   `common.*` (`common.json`) or `ui.*` (`ui.json`). Lint enforces this.
2. **String props** — `aria-label`, `alt`, `title`, `placeholder`, `label` props are YAML-backed
   too. An `<img src={imgSrc(data.x.photo)} alt="literal">` is a partial violation: the path is
   editable, the description isn't. Add a matching `data.x.photoAlt` (or reuse the page's
   existing `label` / `alt` field). Exception: `alt=""` on a purely decorative image is correct
   accessibility practice, not a bug.
3. **Image paths** — live in YAML as `/assets/images/...` (`yaml-to-json` strips the leading
   `/`) and are resolved in code with `imgSrc()` from `src/utils/imgSrc.js`. Don't pre-apply
   `imgSrc` to images handed to `Lightbox` — it applies it itself.
   A failed `<img>` is swapped for the `placeholderImage` from `site.yaml` by
   `src/utils/imagePlaceholder.js`, so a wrong path never looks broken: check the file exists.
   Since 2026-11-24 `content:validate` checks every local file path in YAML whatever its key
   (a missing file or a bare file name with no folder is a warning).
4. **Breadcrumb names** — the last breadcrumb step is the page's `meta.breadcrumbName` in its
   YAML; the parent steps are `site.breadcrumbs.*` from `content/shared/site.yaml`
   (`import site from '../data/site.json'`). Never type `{ name: 'Home' }` in JSX.
5. **JSON-LD / SEO** — site-wide facts (name, url, logo, email, lives-impacted figure,
   description, founding year) live in `content/shared/site.yaml` and reach `index.html`
   JSON-LD, `<title>`, `og:site_name` and `/llms.txt` through `scripts/siteDataPlugin.js`; pages
   take SEO strings from `data.meta.seoTitle` / `seoDescription`. Don't hardcode them. Write any
   `<script type="application/ld+json">` with `jsonLdText()` (`src/utils/jsonLd.js`), never plain
   `JSON.stringify`: pages are prerendered to HTML, and Sheet text with `</script>` would break out.
   A Sheet URL rendered as `href` / iframe `src` goes through `safeHttpUrl` / `safeEmbedUrl`
   (`src/utils/safeUrl.js`) — the Sheet text is public input (audit P4).
6. **Facts that must match `site.yaml`** — if a page YAML states the contact e-mail or the
   lives-impacted total, it must equal `site.yaml` (`tidefoundation@gmail.com`, `52,500+`).
   `npm run content:validate` fails otherwise.
7. **Exempt:** the Pramaan resource data from the Sheet snapshot (`src/data/sheets/pramaan-library.json`).

## Procedure

1. **Before writing new JSX, check whether the page already imports its data file.** Pattern:
   `import data from '../data/<page-name>.json'`. If you're adding a new page, the YAML→JSON
   sync auto-discovers any new file dropped into `content/pages/` or `content/shared/` — no
   registration step needed (it walks both directories recursively). Create the matching
   `content/pages/<name>.yaml` (or `content/shared/<name>.yaml` for cross-page chrome)
   alongside the component, not after. Two gotchas of that script: output is flat
   (`src/data/<basename>.json`, so same-named files in different folders overwrite each other)
   and it never deletes the JSON of a removed YAML file.

2. **For every literal string in your JSX that a visitor would read, ask: does this come from
   `data.xxx`?** If not, it's a violation unless it matches one of the SKIP categories above.
   Two established, correct patterns to choose between:
   - **Page-specific content** → add a field to that page's YAML and read it as
     `data.section.field`.
   - **Reusable micro-copy used identically across multiple pages** (a caption, a generic hint,
     an aria-label) → add it to `content/shared/common.yaml` (`step`, `viewLinkedIn`) or `content/shared/ui.yaml` (shared UI component text:
     `lightbox.*`), then `import common from '../../data/common.json'` (or
     `ui from '../../data/ui.json'`) and use `common.step`. See `OurTeam.jsx`'s
     `common.viewLinkedIn` for a working example. Check `common.yaml` and `ui.yaml` for an
     existing key before adding a new one; duplicated near-identical strings across files are a
     sign one should have been shared from the start.
   - A string with a variable part uses a `{token}` in the YAML value and a
     `.replace('{token}', value)` in code (examples: `ui.yaml` `lightbox.goTo`, `footer.yaml`
     `socialAriaLabel`, `pramaan-library.yaml` `detail.titleTemplate`).

3. **For every `<img>`/media element, check both `src` and `alt`** (see checklist item 2).

4. **Verify, don't assume:** run `npm run content:sync` and confirm the new JSON file/field
   appears as expected, then `npm run lint` (this is where `jsx-no-literals` fires),
   `npm test` and `npm run build`. If you added image paths or touched an e-mail or a
   lives-impacted figure, also run `npm run content:validate` — it checks values starting with
   `/` under key names such as `photo`, `src`, `logo`, `image`, `poster`, `img`, `coverImage`,
   `heroPhoto`, `mainPhoto`, `diagramPhoto`, `backgroundImage`, `donorPoster` (missing files
   are warnings), and errors on any e-mail or lives-impacted total that differs from
   `site.yaml`. Spot-check the rendered page (dev server + screenshot, or Playwright) for at
   least the specific element you changed — a missing or misspelled YAML key fails silently as
   `undefined` in JSX, not as a build error.

5. **If you find an unrelated existing violation while in a file for another reason, fix it and
   call it out separately** — same standing project convention as `doc-sync`.

## Quick self-check (run before considering a page "done")

```bash
# 1. The lint guard — bare visible text in JSX fails here
npm run lint

# 2. Hardcoded visible attributes (lint catches most of these since 2026-11-24; this also covers files outside its scope)
grep -rnE "(aria-label|alt|title|placeholder)=\{?['\"][A-Za-z]" src/pages src/components

# 3. Hardcoded image paths in JSX (should come from YAML)
grep -rnE "assets/images" src/pages src/components

# 4. Breadcrumb names typed in JSX (should be site.breadcrumbs.* / data.meta.breadcrumbName)
grep -rnE "name: '[A-Z]" src/pages
```

As of 2026-11-24 (audit P1), checks (2), (3) and (4) return nothing in `src/pages` and
`src/components`, and `npm run lint` is clean. (The `PageHero` banner texture, once the one image
path built in code, is now `site.yaml` `pageBannerTexture`.) None of the checks is exhaustive (multi-line JSX,
template literals and conditional ternaries inside `{}` won't match) — they're a fast first
pass, not a substitute for reading the file.

## Reference case: the 2026-06-21 full-site audit

A worked example exists in this repo's git history (commit `1c80ca5`, "Close CMS gaps: wire
hardcoded text/alt across 14 pages into YAML/i18n"). An Explore agent surveyed all 24 pages and
reported 22 findings across 8 files; manual verification against the actual code confirmed most,
**caught one false positive** (`PublicationsCombined.jsx` already used the correct pattern
— the agent mischaracterized working code as broken), and an independent grep sweep afterward
found **11 additional real violations the agent's read-through missed entirely** (8 hardcoded
`alt` attributes, 3 instances in `src/components/abl/*` — outside the page-only scope the agent
was given). Lesson encoded into this skill: a single survey pass, even a thorough one, is not
sufficient — verify findings before fixing them, and always run an independent pattern-based
sweep afterward to catch what a read-through missed.

### Later passes

A follow-up (documented 2026-10-25) moved roughly 100 remaining hardcoded strings and 12 image
paths into YAML: the Pramaan screens became fully YAML-backed (`abl-resource-center.yaml`,
`abl-detail.yaml` — both retired 2026-11-19 with the old live-read Resource Centre; the
Resource Centre text is now `pramaan-library.yaml` — and additions to `abl-home.yaml`), shared micro-copy went to
`content/shared/common.yaml` and `ui.yaml`, and the `react/jsx-no-literals` lint guard was added.
After that, the multilingual framework was removed (archived in the local git tag
`archive/multilingual-framework`), breadcrumb names and JSON-LD facts moved into
`meta.breadcrumbName` and `content/shared/site.yaml`, and `content:validate` gained the
e-mail / lives-impacted consistency check.
