# Maintenance: Changing the "Contribute a Resource" Form Link

**Who is this for?** The site owner. No coding needed. Follow the steps in order and do not skip any.

**When do I need this?** Whenever the Google Form behind the **Contribute** page (`/pramaan/contribute`, button "Open Contribution Form") is replaced by a new form with a new web address (URL).

**Time required:** about 10 minutes (most of it is waiting for the site to rebuild).

**What you will do, in one line:** paste the new form address into a GitHub setting called a *secret*, then ask GitHub to rebuild the website so it picks the new address up.

> **Why a rebuild is needed.** The form address is baked into the website when it is built. Changing the secret alone changes nothing on the live site until the next build. This is the step people forget.

---

## Before you start

You need:

- Your GitHub login, with access to the repository `vaibhav-sharma0105/tide-testing` (you must be the owner or an admin of it; if you do not see **Settings** at the top of the repository page, you do not have enough access).
- The **new** Google Form address. To get it: open your form in Google Forms, click **Send** (top right), click the **link icon** (🔗), tick **Shorten URL** if you like, click **Copy**.

The address currently in use (set on 2 November 2026) is:

```
https://docs.google.com/forms/d/e/1FAIpQLSfbWm7Jtp73QUe0y3pVjdsQ-1ywTh-OpW9U63QRbDONdWrUeg/viewform?usp=dialog
```

A Google Form address is public (anyone who visits the site can see it), so it is safe to keep it in this document.

---

## Step 1 — Open the secrets page

1. Go to **https://github.com/vaibhav-sharma0105/tide-testing**.
2. Click **Settings** (the tab with a gear icon, far right in the row under the repository name).
3. In the left sidebar, scroll to the **Security** section and click **Secrets and variables**. A small menu opens beneath it.
4. Click **Actions**.

You should now see a page titled **Actions secrets and variables**, with a **Repository secrets** list.

> **Check:** in that list you should see a secret named exactly `VITE_ABL_CONTRIBUTE_FORM_URL`. If you do not, jump to *"If the secret is not in the list"* at the bottom.

## Step 2 — Replace the value

1. In the **Repository secrets** list, find the row `VITE_ABL_CONTRIBUTE_FORM_URL`.
2. Click the **pencil icon** (✏️) at the right end of that row. (It may say **Update** instead of showing a pencil.)
3. A box opens. It will be **empty** — GitHub never shows an old secret. That is normal.
4. Paste the new form address into the **Secret** box.
   - Paste the **whole address**, starting with `https://`.
   - Do **not** type quotation marks around it.
   - Make sure there is **no space** before or after it (a trailing space is the most common mistake).
5. Click the green **Update secret** button.

> **Check:** the row now shows "Updated just now" (or "now"). That is the only confirmation GitHub gives; it will not display the value.

## Step 3 — Rebuild the website

1. Click the **Actions** tab at the top of the repository page (the tab with a play-button icon, next to **Pull requests**).
2. In the left sidebar, click **Deploy to GitHub Pages**.
3. On the right, above the list of runs, click the grey **Run workflow** button. A small box opens.
4. Make sure **Branch: main** is selected, then click the green **Run workflow** button inside the box.
5. Wait a few seconds and refresh the page. A new row appears at the top of the list with a **yellow spinning circle** (running).
6. Wait about **2–4 minutes**, refreshing every minute, until the circle becomes a **green tick** ✅.

> **If it shows a red cross** ❌: click the row, then click the red step to read the message. The usual cause is a mistake in the website's code, not in the secret. Do not change the secret again; ask your developer, sending them a screenshot of the error.

## Step 4 — Check the live site

1. Open the live site's Contribute page: **https://vaibhav-sharma0105.github.io/tide-testing/pramaan/contribute**.
2. Hold **Ctrl** and press **F5** (on a Mac: **Cmd + Shift + R**) to make sure you are not seeing an old saved copy of the page.
3. Click **Open Contribution Form**. A new tab should open with the **new** Google Form.
4. Compare the form's title with the one you expect. If it is the new form, you are done.

> **If the button is greyed out and says "Form link coming soon":** the secret is empty or missing. Go back to Step 2 and paste the address again, then repeat Step 3.
>
> **If the button still opens the OLD form:** you probably skipped Step 3, or Step 3 had not finished (no green tick yet). Check the **Actions** tab, then hard-refresh again (Step 4.2).

---

## If the secret is not in the list

1. On the same page, click the green **New repository secret** button.
2. **Name:** type exactly `VITE_ABL_CONTRIBUTE_FORM_URL` (capital letters, underscores, no spaces).
3. **Secret:** paste the form address (same rules as Step 2.4).
4. Click **Add secret**, then continue from **Step 3**.

---

## Keeping your own computer in step (developers only)

If someone runs the site on their own computer (`npm run dev`), the same address goes in a file called `.env.development` in the project folder, on the line that starts `VITE_ABL_CONTRIBUTE_FORM_URL=`. That file is private to each computer and is never uploaded, so it must be edited separately. Restart the dev server afterwards.

---

## Quick checklist

- [ ] Secret `VITE_ABL_CONTRIBUTE_FORM_URL` updated (Step 2), no spaces, starts with `https://`
- [ ] **Deploy to GitHub Pages** run manually and finished with a green tick (Step 3)
- [ ] Live Contribute button opens the new form after a hard refresh (Step 4)

*Related: where this setting is used — `src/config/abl.js` (`CONTRIBUTE_FORM_URL`) and `.github/workflows/deploy.yml`; the other recurring chore is `docs/MAINTENANCE-GITHUB-PAT-REFRESH.md`.*
