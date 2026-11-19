# Maintenance: Changing the "Contribute a Resource" Form Link

**Who is this for?** The site owner. No coding needed. Follow the steps in order.

**When do I need this?** Whenever the Google Form behind the **Contribute** page (`/pramaan/contribute`, button "Open Contribution Form") is replaced by a new form with a new web address (URL).

**Time required:** about 5 minutes (most of it is waiting for the site to rebuild).

**What you will do, in one line:** change one line in a text file on GitHub (`content/pages/abl-contribute.yaml`, the line starting `formUrl:`) and save it. Saving starts the rebuild by itself.

> **Since 19 November 2026** the link lives in that file, not in a GitHub *secret*. A form link is public anyway (anyone on the site can see it), so it does not need to be hidden. The old secret `VITE_ABL_CONTRIBUTE_FORM_URL` is no longer read by the website — changing it does nothing.

---

## Before you start

You need:

- Your GitHub login, with write access to the repository `vaibhav-sharma0105/tide-testing`.
- The **new** Google Form address. To get it: open your form in Google Forms, click **Send** (top right), click the **link icon** (🔗), tick **Shorten URL** if you like, click **Copy**.

The address in use (set 19 November 2026) is:

```
https://docs.google.com/forms/d/e/1FAIpQLSfbWm7Jtp73QUe0y3pVjdsQ-1ywTh-OpW9U63QRbDONdWrUeg/viewform?usp=dialog
```

This form should be the one that feeds the Resource Centre Sheet ("Contributing to Pramaan; Educators' Resource Bank (Responses)"), so that what people submit can appear in the Resource Centre once its consent answers are "Yes".

---

## Step 1 — Open the file

1. Go to **https://github.com/vaibhav-sharma0105/tide-testing/blob/main/content/pages/abl-contribute.yaml**.
2. Click the **pencil icon** (✏️, "Edit this file") at the top right of the file.

## Step 2 — Replace the link

1. Find the line that starts with `formUrl:` (near the bottom).
2. Replace only the address between the two quotation marks. The line must look like this:
   ```yaml
   formUrl: "https://docs.google.com/forms/d/e/....../viewform"
   ```
   - Keep the quotation marks.
   - Paste the **whole address**, starting with `https://`.
   - No space before or after the address inside the quotes.
   - Accepted: links starting `https://docs.google.com/forms/` or `https://forms.gle/`. Anything else makes the website check fail on purpose (see Step 4).
3. To show the button greyed out with "Form link coming soon" instead (for example while a new form is being prepared), write `formUrl: ""`.

## Step 3 — Save

1. Click the green **Commit changes…** button (top right).
2. In the box that opens, keep **Commit directly to the `main` branch** selected and click **Commit changes**.

This starts the rebuild automatically.

## Step 4 — Wait for the rebuild

1. Click the **Actions** tab at the top of the repository page.
2. The newest row is **Deploy to GitHub Pages** with your change's title, and a **yellow spinning circle**.
3. Wait about **2–4 minutes**, refreshing every minute, until it becomes a **green tick** ✅.

> **If it shows a red cross** ❌: click the row, then the red step. If the message mentions `abl-contribute.yaml` and `formUrl`, the link is not a Google Forms link or the quotation marks are missing — go back to Step 1 and fix the line. For any other message, ask your developer, sending a screenshot. The live site keeps the previous link until a rebuild succeeds.

## Step 5 — Check the live site

1. Open **https://vaibhav-sharma0105.github.io/tide-testing/pramaan/contribute**.
2. Hold **Ctrl** and press **F5** (on a Mac: **Cmd + Shift + R**) so you are not seeing an old saved copy.
3. Click **Open Contribution Form**. A new tab should open with the **new** Google Form.

> **If the button is greyed out and says "Form link coming soon":** `formUrl` is empty. Go back to Step 1.
>
> **If the button still opens the old form:** the rebuild had not finished (no green tick yet), or the page is cached — check the Actions tab, then hard-refresh again.

---

## For developers

- Code: `src/pages/resources/AblContribute.jsx` reads `formUrl` from `src/data/abl-contribute.json` (generated from the YAML); a value that does not start with `https://` shows the greyed-out button.
- Check: `npm run content:validate` (also run by the deploy) errors unless `formUrl` is empty or a `https://docs.google.com/forms/…` / `https://forms.gle/…` link, and warns when it is empty.
- Test: `src/test/pages/pramaanSwitch.test.jsx`.
