# Visual baselines

A small screenshot set (header, footer, four page banners, three cards) compared against
`e2e/visual/visual.spec.js-snapshots/*-visual-win32.png`. It is **local only**: baselines are
per platform (fonts render differently on Linux), so CI does not run it.

```powershell
$env:GITHUB_ACTIONS='true'; npm run build    # the base-path build the suite serves
npm run test:e2e:visual                       # compare
npm run test:e2e:visual -- --update-snapshots # accept an intended change, then review the PNGs in git
```

When a comparison fails, open the HTML report (`npx playwright show-report playwright-report-site`
after a run with `--reporter=html`) to see expected / actual / diff side by side.

Expect to update a baseline when:
- the design of that element changed on purpose;
- a sync changed the row a card shows (the Resource Centre card is resource `W1`, the partner card
  is the first partner with a website, the fellow card is the first fellow in the snapshot);
- the banner photo or text of a page changed in YAML.

Fonts from Google Fonts are stubbed in these runs (system fallbacks), so the screenshots show layout,
colour and spacing, not the brand typefaces.
