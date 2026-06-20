---
name: doc-sync
description: >
  TRIGGER — invoke this automatically, without being asked, immediately after finishing any
  change in this repo that touches: a content-management/CMS pipeline step (YAML→JSON sync,
  i18n pipeline), site/route structure (new pages, changed router behavior), a major
  code-architecture pattern (new subsystem, new data flow, a removed/replaced layer, new
  automated pipeline such as a GitHub Actions workflow or a sync script), the design-system
  source of truth (tailwind.config.js, index.css design tokens), OR the public API of any
  component/utility/hook that AGENTS.md already documents (props renamed or changed shape,
  a function's signature or return type changed, a file moved), OR a documented constant's
  set of valid values changed (e.g. a new entry added to TAB_STYLE_MAP, the GRADES list
  growing past 5, a new Sheet tab) — these are easy to miss because they don't feel like
  "new architecture," but a doc stating "Grades 1-5" or listing four resource types is just
  as actively wrong as a doc describing a whole missing pipeline once a fifth type exists. Also
  trigger mid-task if you notice an EXISTING claim in docs/*.md, CLAUDE.md, or AGENTS.md is
  already wrong, even if unrelated to the current change — fix it inline while you're there,
  then call it out as a separate finding. Use this even when the user's request had nothing
  to do with documentation — they asked for the code change, not a docs reminder, and the
  sync still needs to happen.
  SKIP for content-only edits (YAML copy/text changes with no structural shape change),
  routine bug fixes with no architectural impact, visual/styling polish that doesn't change
  a documented pattern or token or prop, and any change already fully and correctly
  described by an existing doc.
---

# Doc Sync — Keep Human and Agent Docs Truthful

## Why this exists

This repo has two audiences for documentation: humans (`docs/*.md`) and AI agents picking up
the project cold (`CLAUDE.md`, `AGENTS.md`). Both rot the same way — a structural change ships
in code, the docs describing that area don't get touched, and the next reader (human or agent)
acts on a stale claim. The cost is asymmetric: a wrong claim in `AGENTS.md` doesn't just waste
time, it actively misleads an agent into building on a false premise (e.g. testing routes with
`/#/path` hash URLs because a doc says `HashRouter`, when the app actually uses `BrowserRouter`
— this happened mid-session on 2026-06-21 and cost real debugging time before the truth was
found by reading `App.jsx` directly).

This skill is the habit of treating documentation updates as part of the change itself, not a
followup task that may or may not happen.

## Scope

**In scope:** `docs/*.md`, `CLAUDE.md`, `AGENTS.md`, and any project skill files under
`.claude/skills/` that describe the changed area.

**Out of scope:** the user's persistent memory files under
`~/.claude/projects/<project>/memory/*.md`. Those are a separate, auto-persisted system with
their own update conventions (see the main system prompt's memory instructions) — update them
too if you're the kind of session that has memory access and the change is significant enough,
but it is not what this skill governs, and a memory update is never a substitute for fixing the
repo docs.

## Procedure

1. **Identify what actually changed.** Use `git diff`/`git log` for the current session's
   commits, or your own knowledge of what you just built if not yet committed. Categorize it:
   new/changed pipeline, new/changed subsystem, route or file-structure change, design-token
   change, a documented component/utility's public API changed shape, a documented constant's
   set of valid values changed (new resource type, new grade level, new locale), or "not
   structural" (skip). The middle two are the ones to watch for — both are easy to rationalize
   away as "just a small addition" while still leaving a doc actively describing a prop,
   signature, or value range that no longer matches reality.

2. **Map the change to the docs that describe that area.** Don't guess which file needs
   updating — grep for it:
   ```
   grep -rn "<old-function-name-or-pattern>" docs/*.md CLAUDE.md AGENTS.md .claude/skills/*.md
   ```
   A repository-layout tree, a component/utility API reference, a "key files" list, and a
   subsystem-specific doc in `docs/` can all independently reference the same changed file —
   find every one, not just the first match.

3. **Verify before writing, every time.** Never update a doc from memory of what the code
   "should" say — read the actual current file. For factual claims with a single canonical
   source (a hex color, an env var name, a file path), prefer corroborating from a *second*,
   independent location in the codebase before asserting correctness (e.g. this session's
   color-token fix was cross-checked against both `tailwind.config.js` and the hardcoded
   gradient literals in `index.css` before being written into the docs).

4. **Write the update as a correction, not a rewrite.** Preserve the surrounding doc's voice
   and structure. If a whole subsystem is new (e.g. a new automated pipeline), it likely needs:
   - An entry in the repository-layout tree (`AGENTS.md` §2)
   - A new subsection explaining the pipeline (where? — find the most relevant existing
     numbered section, e.g. the "ABL Subsystem" section absorbed the thumbnail-sync pipeline)
   - Updated "Key files" / utility-reference entries for any new or changed function signatures
   - A new dedicated `docs/*.md` guide **only if** the change needs step-by-step human
     instructions a non-developer would follow (e.g. a one-time Google account setup) — don't
     create a new doc file for something a paragraph in an existing doc can cover.

5. **If you find unrelated drift while you're in there, fix it and say so.** Per established
   project preference: correct it as part of the same pass (you already found it; leaving it
   for later means re-discovering it), but call it out explicitly afterward as a separate,
   unrelated finding so the user understands why it's in the diff.

6. **Sanity-check, then report — don't auto-commit.** Run `npm run lint`/`npm run build` if
   you touched anything besides pure prose (habit, not usually load-bearing for `.md` edits).
   Documentation changes still follow the repo's normal commit policy — don't commit without
   being asked, even though this skill's job is to make the update, not to ship it unasked.
   Summarize what was changed and why when you report back.

## Reference case: the 2026-06-21 audit

A full worked example of this procedure exists in this repo's git history (commits around
`aeeaf59` and `f2a99d6`, June 21). In one pass: a new thumbnail self-hosting pipeline (Apps
Script extensions, a GitHub Actions workflow, a new sync script, a new utility module, a new
Lightbox component) was documented across `AGENTS.md`'s repository layout, component API,
and utility reference sections, plus a new "Thumbnail sync pipeline" subsection; a redesigned
detail page was flagged as diverging from the original spec doc; and two **pre-existing**,
unrelated inaccuracies (a `HashRouter` claim that was actually `BrowserRouter`, and four wrong
design-token hex values) were discovered, fixed, and called out separately. Use that diff as a
concrete template for thoroughness and tone.
