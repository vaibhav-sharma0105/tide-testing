# Social Changemakers Sheet — what the website reads

The **Past SCF** page (`/education-for-harmony/social-changemakers`) shows one profile per fellow of
TIDE's Social Changemakers Fellowship (SCF). The profiles come from the Google Sheet
**"Social Changemakers' Fellowship Completion Form (Responses)"** (the responses of the fellowship
completion Google Form), through the Apps Script `apps-script/social-changemakers/Code.gs` and the
GitHub sync (`scripts/sync-social-changemakers.js`). The browser never reads the Sheet.

Setup: `docs/SOCIAL-CHANGEMAKERS-SETUP-GUIDE.md`.

## The tab

The responses tab is found by its header row (the one with the **"SCF Batch"** question), so its name
("Form responses 1" today) doesn't matter.

## Columns the website reads

Columns are found by the **start of their header text** (capitals and extra spaces ignored), never by
their letter, so adding or moving a column is safe. Letters below are as of 2026-11-23.

| Col | Header starts with | Used for | Required header |
|---|---|---|---|
| A | `Timestamp` | only to make an anonymous id — never published | no |
| C | `Order to post within batch` | the order of the profiles inside a batch (1, 2, 3 …) — **never shown** | yes |
| D | `SCF Batch` | the batch heading, e.g. "23-24"; newest batch first | yes |
| E | `Name` | the fellow's name (under the photos) | yes |
| F | `Project name` | the project's title (under the photos, and the card's heading) | yes |
| G | `Write 50-100 words summary` | the project summary | no |
| H | `Upload your photo` | the front photo (the fellow) | no |
| I | `Upload one photo that captures your real field work` | the back photo (shown on hover / tap) | no |
| J | `Submit the final video` | "Project video" button — only if the Drive file is shared publicly | no |
| L | `What are the next steps` | "What's next" (folded by default) | no |
| T | `Upload webpage write-up` | the fellow's write-up (a Word document), opened in Drive's viewer — only if shared publicly | no |
| U | `Upload your testimonial video` | "Hear from the fellow" button — only if shared publicly | no |
| — | `Hide from website` (optional, add any time) | `Yes` = the row is not shown | no |

## Columns that are never read

`Email address` (B), `Email Id` (K) and every other column (M–S, V: event, certificate, newspaper and
continuation-plan questions, more field-work photos). The script only looks at
the cells of the columns listed above.

## Which rows are published

Every response with a **Name** and an **SCF Batch** (owner decision, 2026-11-23: every form submission
is a fellow; consent to appear on the website is part of the fellowship). Rows without one of them are
skipped and reported. To take a profile down without deleting the response, add a column headed
`Hide from website` and type `Yes` in that row. Whether the stakeholder wants an explicit "publish"
column instead is an open question (`docs/STAKEHOLDER-REVIEW-2026-11-28.md` §8).

## Order on the page

1. **Batch, newest first** — by the first year in the text, so `23-24`, `2023-24` and `23–24` sort the
   same; a batch whose year can't be read goes last.
2. **Order to post within batch**, smallest first (a number; the text "3." or " 3 " also works). A row
   without a number goes last in its batch and is reported.
3. Then the name, A→Z.

## Photos

Upload them through the Form (Drive files). Photos **pasted into a cell as images** can't be read by the
script — they must be file uploads. Each photo is downloaded by the sync, turned the right way up,
resized to at most 1200 px (never enlarged, never cropped) and saved as WebP on the website. The page
shows both photos in the same frame; the front photo is aligned to its upper part, where faces usually
are. A card without photos shows the fellow's initials.

## Videos and the write-up

The write-up (T, a Word document) is shown the same way as a Drive video: only when the file is shared
"Anyone with the link", opened in Drive's own viewer.

Video cells (J, U) may hold a Drive upload or a YouTube link. A Drive video is shown **only if the file is
shared "Anyone with the link"** — the script checks each file and reports the ones that aren't, so a
private video never appears as a broken player. A YouTube link is played from youtube-nocookie.com.
The player opens only when a visitor presses the button. For a public Drive video the sync also saves one
frame (from Drive's own thumbnail) as the tile's poster image; a YouTube video gets a plain tile.

## Ids

A profile's id is `SC-` + the first 10 hex characters of a SHA-256 of its Timestamp. A row typed into the
Sheet by hand (no Timestamp) gets an id from its batch + name instead — so changing the name of such a
row changes its id (its photos are fetched again).

## Safety rules (the sync)

- More than max(10, 20%) of the profiles disappearing at once, or more than max(10, 20%) of the photos
  being deleted, publishes **nothing** until someone confirms with `allow_large_change`.
- A photo Drive can't read keeps its previous copy; photos are deleted only when their row or link is gone.
- Only the fields in this document can reach the website; an email address found in any text field is
  removed and reported.
- Problems become one GitHub Issue: "Social Changemakers Sheet: some rows need attention".
