// P4 security audit (2026-11-24): guards for .github/workflows/*.yml. These fail when a change would
// reopen a hole that is easy to add by accident:
//   - GitHub Actions expression injection: `${{ … }}` with text someone outside the repo controls
//     (issue / PR / comment / commit text, branch names, workflow inputs other than booleans)
//     placed straight into a `run:` script, where it becomes shell code;
//   - triggers that run with secrets on code or text from forks (pull_request_target, issue_comment…);
//   - an action not pinned to a full commit SHA; a checkout that leaves its token in .git/config;
//   - the write token handed to a whole sync job (it must reach only the steps that call GitHub,
//     never the step that processes Form uploads).
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { describe, it, expect } from 'vitest'

const DIR = path.resolve('.github/workflows')
const files = fs.readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f))
const load = (f) => ({ file: f, text: fs.readFileSync(path.join(DIR, f), 'utf8'), wf: yaml.load(fs.readFileSync(path.join(DIR, f), 'utf8')) })
const workflows = files.map(load)

// Contexts whose values are trusted inside a run: script (set by GitHub or by the repo's own owner).
const SAFE_EXPR = [
  /^runner\.temp$/,
  /^needs\.[\w-]+\.result$/,
  /^steps\.[\w-]+\.outputs\.[\w-]+$/,
  /^github\.(repository|run_id|sha|ref|workflow|event_name|server_url|token)$/,
]
const exprs = (s) => [...String(s).matchAll(/\$\{\{\s*([\s\S]*?)\s*\}\}/g)].map((m) => m[1])

const steps = (wf) => Object.entries(wf.jobs || {}).flatMap(([job, j]) => (j.steps || []).map((s) => ({ job, step: s })))

describe('GitHub Actions workflows', () => {
  it('finds the six workflows', () => {
    expect(files.sort()).toEqual(['deploy.yml', 'e2e-nightly.yml', 'sync-partners.yml', 'sync-pramaan-library.yml', 'sync-publications.yml', 'sync-social-changemakers.yml'])
  })

  it('no run: script interpolates untrusted context (expression injection)', () => {
    const bad = []
    for (const { file, wf } of workflows) {
      for (const { job, step } of steps(wf)) {
        if (!step.run) continue
        for (const e of exprs(step.run)) {
          if (!SAFE_EXPR.some((re) => re.test(e))) bad.push(`${file} › ${job} › ${step.name}: \${{ ${e} }}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('the guard itself catches the classic injections', () => {
    for (const e of ['github.event.issue.title', 'github.event.pull_request.body', 'github.head_ref', 'inputs.note', 'github.event.comment.body']) {
      expect(SAFE_EXPR.some((re) => re.test(e)), e).toBe(false)
    }
  })

  it('no trigger runs with secrets on fork code or on text typed by outsiders', () => {
    for (const { file, wf } of workflows) {
      const on = wf.on ?? wf[true] // js-yaml reads a bare `on:` key as the boolean true
      const triggers = typeof on === 'string' ? [on] : Array.isArray(on) ? on : Object.keys(on || {})
      for (const t of ['pull_request_target', 'workflow_run', 'issue_comment', 'issues', 'discussion', 'discussion_comment', 'pull_request_review_comment']) {
        expect(triggers, `${file}: ${t}`).not.toContain(t)
      }
    }
  })

  it('workflow_dispatch inputs are booleans only (a free-text input would be attacker-shaped text)', () => {
    for (const { file, wf } of workflows) {
      const on = wf.on ?? wf[true]
      const inputs = on?.workflow_dispatch?.inputs || {}
      for (const [name, def] of Object.entries(inputs)) expect(def.type, `${file}: ${name}`).toBe('boolean')
    }
  })

  it('every action is pinned to a full commit SHA', () => {
    for (const { file, wf } of workflows) {
      for (const { step } of steps(wf)) {
        if (step.uses) expect(step.uses, `${file}: ${step.uses}`).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/)
      }
    }
  })

  it('every checkout leaves no token in .git/config', () => {
    for (const { file, wf } of workflows) {
      for (const { job, step } of steps(wf)) {
        if (String(step.uses || '').startsWith('actions/checkout@')) {
          expect(step.with?.['persist-credentials'], `${file} › ${job}`).toBe(false)
        }
      }
    }
  })

  it('top-level permissions are read-only or empty', () => {
    for (const { file, wf } of workflows) {
      const p = wf.permissions
      const ok = p && Object.values(p).every((v) => v === 'read')
      expect(ok || (p && Object.keys(p).length === 0), file).toBeTruthy()
    }
  })

  it('in the sync jobs, the token never reaches the step that processes Sheet data', () => {
    for (const { file, wf } of workflows.filter((w) => w.file.startsWith('sync-'))) {
      const job = wf.jobs.sync
      expect(job.env?.GH_TOKEN, `${file}: job-level GH_TOKEN`).toBeUndefined()
      const run = job.steps.find((s) => s.name === 'Run sync')
      expect(run, file).toBeTruthy()
      expect(JSON.stringify(run.env || {}), file).not.toMatch(/github\.token|GH_TOKEN|GITHUB_TOKEN/)
      // the push credential is set only after the sync step
      const order = job.steps.map((s) => s.name)
      expect(order.indexOf('Let git push'), file).toBeGreaterThan(order.indexOf('Run sync'))
      expect(order.indexOf('Let git push'), file).toBeLessThan(order.indexOf('Commit and push'))
      // dependency install scripts never run while a write token exists in the job
      expect(job.steps.find((s) => s.name === 'Install dependencies').run, file).toBe('npm ci --ignore-scripts')
    }
  })
})
