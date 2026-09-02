# CLAUDE.md — Boxwright

Guidance for Claude Code working in this repo.

## What this is
A marketing site and quote builder for a corporate gift-kit company. Pick a
category, item, decoration method and per-kit quantity from cascading
dropdowns; an itemised quote (volume breaks, decoration setups, assembly,
freight, rush, program discount) updates live. Eleven seasonal palettes,
light and dark.

`README.md` carries the full pricing model and the reasoning behind each
number — read it before changing anything in `catalog.js`.

## Stack
None. Deliberately. `index.html` + `styles.css` + `catalog.js` + `app.js`,
loaded as plain `<script>` tags so the page also opens straight off `file://`.
No framework, no bundler, no package.json, no backend.

## Run it
```bash
npx http-server . -p 8899        # http://127.0.0.1:8899
node bundle.mjs                  # dist/boxwright.html      (fragment)
node bundle.mjs --full           # dist/boxwright-full.html (complete document)
```
`bundle.mjs` only ever concatenates the four sources, so a bundle cannot drift
from the site. `dist/` is generated and gitignored.

## Rules that are load-bearing
- **`quote(state)` in app.js is pure.** State in, a fully costed breakdown out,
  no DOM. The hero card, all six preset cards, the live panel and the
  next-tier insight are views of that one return value. A new cost goes there
  and nowhere else.
- **Line rows are built once and mutated in place.** `nodes` maps `uid -> DOM`;
  only the affected row's dependent selects are rebuilt on a cascade.
  Re-rendering the list would yank focus out of the `<select>` the user is
  inside — which is the entire interface.
- **Quantity breaks apply per line, on that line's total units.** Decoration
  stays flat per unit (a screen prints at the same speed at 50 or 5,000), and
  setup/tooling is charged once per line — that is what makes small runs
  expensive, so it is always broken out rather than folded into unit price.
- **Lead time is the slowest item in the box**, plus assembly, then rush halves
  it with an 8-day floor.
- **Factory minimums are flagged, not priced through.** A line under its MOQ
  turns amber and raises an alert instead of quoting a number a factory would
  refuse.
- **A theme is three colors.** `[data-theme]` supplies `--brand`, `--accent`,
  `--pop`; the light/dark mode layer derives every surface by `color-mix`-ing
  neutrals with `--brand`. No component hard-codes a hue, so a palette cannot
  half-apply. `--pop` marks highlight state, never chrome.
- **Icons are real SVGs** in the sprite at the top of `index.html`, never emoji.
- **Nothing is transmitted.** The quote form is client-side; the build persists
  to `localStorage`, wrapped in try/catch — blocked storage, quota and private
  mode must never take the page down.
- Only one next-break tip shows at a time: with equal per-kit quantities every
  line produces the identical sentence, which reads as noise.

## Before committing
Load the page and check the quote panel still prices: at 100 kits the default
build is $110.86/kit, and dropping to 12 kits should raise five minimum-quantity
alerts. `node bundle.mjs --full` and open the result to confirm the single-file
build still runs.
