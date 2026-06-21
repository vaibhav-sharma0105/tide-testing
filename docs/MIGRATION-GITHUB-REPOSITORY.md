# Migrating the GitHub Repository to a New Owner

**Who is this for?** Both the current owner (developer) and the new owner, doing this together.

**Time required:** ~20 minutes, plus verification.

**Do this after** `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` is fully working — see `docs/MIGRATION-OVERVIEW.md` for why the order matters.

---

## What survives a GitHub repository transfer (confirmed, not assumed)

Before writing steps a non-technical reader will follow literally, this was checked against GitHub's own documentation rather than guessed:

- ✅ **Secrets survive.** All repository secrets (`VITE_ABL_API_URL`, `VITE_ABL_CONTRIBUTE_FORM_URL`, `ABL_SYNC_TOKEN`) remain attached to the repo after transfer — you do not need to re-enter them. ([Source](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository))
- ✅ **Workflow files survive.** Everything in `.github/workflows/` moves with the repo's content, untouched.
- ✅ **The original owner is automatically added as a collaborator.** For a transfer between two personal GitHub accounts (not organizations), GitHub automatically adds the previous owner and existing collaborators to the new repository. The developer does not get locked out.
- ⚠️ **GitHub Pages settings: verify, don't assume.** These should carry over with the repo, but confirm in Step 4 rather than assuming.
- ⚠️ **The site's live URL changes.** GitHub Pages URLs include the *owner's* username (`https://OWNER.github.io/REPO/`). Transferring to a new account changes this even if the repository name stays the same. This is expected, not a bug — Step 5 covers what to update because of it.

---

## Before You Start

- [ ] The new owner has their own GitHub account.
- [ ] You (current owner) have admin access to the repository today.
- [ ] `docs/MIGRATION-GOOGLE-SHEET-APPSCRIPT.md` is complete and verified working.

---

## Step 1 — Transfer the Repository

1. Go to the repository on GitHub.
2. **Settings** tab → scroll to the bottom → **Danger Zone**.
3. Click **Transfer ownership**.
4. Type the repository name to confirm, enter the new owner's GitHub username.
5. Click **I understand, transfer this repository**.
6. The new owner will receive an email/notification to **accept** the transfer — they need to do that before it completes.

---

## Step 2 — New Owner: Accept the Transfer

1. Check email (or GitHub notifications) for the transfer invitation.
2. Click **Accept**.
3. The repository now lives at `https://github.com/<new-owner>/<repo-name>`.

---

## Step 3 — Confirm the Original Developer Still Has Access

1. New owner: go to **Settings → Collaborators**.
2. Confirm the original developer's GitHub account is listed (it should be, automatically).
3. If for any reason it's missing, click **Add people** and invite them with **Write** access.

---

## Step 4 — Verify Settings Survived

1. **Settings → Secrets and variables → Actions** — confirm all three secrets are still listed (you won't be able to see their values, just confirm they exist with a prior "Updated" date — that's normal and expected, secrets are never shown again after creation).
2. **Settings → Pages** — confirm it's still configured to deploy from GitHub Actions (not "branch"), matching how it was set up before.
3. **Actions** tab — confirm the workflows (`Deploy to GitHub Pages`, `Sync ABL Thumbnails`) are listed.

---

## Step 5 — Update the New Live URL

The site's URL is now `https://<new-owner>.github.io/<repo-name>/` instead of the old one. One file references the *old* URL directly and needs updating:

1. Open `index.html`.
2. Find this line:
   ```html
   <meta property="og:image" content="https://OLD-OWNER.github.io/REPO-NAME/assets/images/shared/tide-logo.png" />
   ```
3. Replace `OLD-OWNER` with the new owner's GitHub username (keep the repo name the same unless you're also renaming the repository).
4. Commit and push this change (Path A or B from `CONTENT-GUIDE.md`).

> **Why only this one line?** Every other URL in the site (the canonical link, the `og:url` tag, the schema.org metadata) already points at `tideinternational.org` — the eventual real domain — not the GitHub Pages URL, so those are unaffected by this transfer. If a custom domain (like `tideinternational.org`) is ever connected to GitHub Pages via a `CNAME` file, this whole "the URL changes when ownership changes" problem goes away permanently — worth doing at some point, but out of scope for this migration.

---

## Step 6 — Trigger a Fresh Deploy and Verify

1. **Actions** tab → **Deploy to GitHub Pages** → **Run workflow** (or just wait — the commit from Step 5 triggers it automatically).
2. Once green, visit the new live URL and confirm the site loads correctly.

---

## Step 7 — Final Cleanup: Decouple the GitHub PAT

This is the step that fully removes the original developer's account from the ongoing automation (separate from their collaborator access, which is fine to keep).

1. New owner: generate your own fine-grained GitHub PAT, following Step 7 of `docs/ABL-THUMBNAIL-SYNC-SETUP-GUIDE.md` (resource owner = yourself, repository access = this one repo only, permission = Actions: Read and write only).
2. In the Apps Script editor (your migrated copy from the other guide) → Project Settings → Script Properties → update `GITHUB_PAT` with your new token.
3. Also double check `GITHUB_REPO` matches the repository's new path (`<new-owner>/<repo-name>`) — update it if the owner portion changed.
4. Make a small test edit in the Sheet and confirm a sync run fires automatically within a couple of minutes, using your own credentials end to end.

Once this passes, the migration is fully complete — nothing in the live system depends on the original developer's accounts anymore (their GitHub collaborator access is just for future code changes, not automation).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Site shows a blank/broken page at the new URL | `index.html`'s base path assumption — check `vite.config.js`'s base path still matches the repo name (only the owner changed, not the name, so this usually needs no change) | Confirm the repo name wasn't also changed during transfer |
| Social media link previews show a broken image | Step 5 wasn't completed | Update the `og:image` line in `index.html` |
| Auto-sync stops working after a while | `GITHUB_PAT` expired (fine-grained tokens have an expiration date) | See `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md` |
| New owner can't see repository secrets' values | Expected — GitHub never shows a secret's value again after creation, for anyone, regardless of ownership | Not an error; only matters if you need to know the value (you shouldn't, except `ABL_SYNC_TOKEN`/`GITHUB_PAT` which you set yourself in the other guide) |

---

*Ongoing maintenance: `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md`.*
