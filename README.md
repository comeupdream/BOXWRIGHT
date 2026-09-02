# Boxwright Co. — corporate gift package configurator

A marketing site and package builder for a company that assembles corporate
gift kits — apparel, drinkware, desk goods, puzzles, pins, stickers, stamps,
snacks, tech — and quotes them on the spot.

Zero dependencies, no build step, no backend. Four files:

| File | What it is |
|---|---|
| `index.html` | Markup + the icon sprite (real SVGs, no emoji) |
| `styles.css` | The design system — theme layer, mode layer, components |
| `catalog.js` | Catalogue, decoration methods, price breaks, packaging, presets, palettes |
| `app.js` | Pure `quote(state)` engine + the DOM views over it |

## Run it

```bash
npx http-server . -p 8899        # then open http://127.0.0.1:8899
```

It also opens straight off the filesystem — the scripts are plain `<script>`
tags, not modules, precisely so `file://` works.

Single-file builds:

```bash
node bundle.mjs          # dist/boxwright.html      (fragment, for embedding)
node bundle.mjs --full   # dist/boxwright-full.html (complete document)
```

The bundler only ever concatenates the four sources, so a bundle cannot drift
from the site.

## How the quote works

`quote(state)` in `app.js` is pure — state in, a fully costed breakdown out. It
touches no DOM, which is why the same function prices the hero card, all six
preset cards, the live panel, and the "what if you ordered 250 instead"
insight, without any of them re-implementing the math.

Cost stack, in the order the panel shows it:

1. **Merchandise** — unit price × units, after that line's quantity break.
   Breaks apply **per line, on total units of that line** (100 kits × 2 pens =
   200 pens = the 100+ break), not across the order.
2. **Decoration** — a flat per-unit rate. It is deliberately *not* discounted by
   volume: a screen prints at the same speed whether you run 50 or 5,000.
3. **Setup & tooling** — one-time, per line. Screens, dies, molds, knit setups.
   This is the whole reason a 25-kit run costs so much more per kit than a
   500-kit run of the identical assortment, so it is always broken out.
4. **Packaging + fill**, **finishing touches**, **assembly & QC** (labour, and
   it gets cheaper with volume), **freight** (per kit, with a floor on bulk).
5. **Rush** — 18% on goods + assembly.
6. **Program discount** — 3/5/7% on the merchandise subtotal over $10k/$25k/$50k.

**Lead time is set by the slowest item in the box.** A kit containing an
embroidered varsity jacket (35 production days) ships on the jacket's schedule
no matter how fast the stickers are; add assembly days, then rush halves it
with an 8-day floor.

## Decisions that are load-bearing

- **`quote()` is pure.** Every number on screen is a view of one return value.
  Adding a cost means adding it there and nowhere else.
- **Line rows are built once and mutated in place.** Re-rendering the list on
  every change would yank focus out of the `<select>` the user is inside —
  which is the entire interface. `nodes` maps `uid -> DOM`; only the affected
  row's dependent selects are rebuilt on a cascade.
- **Factory minimums are flagged, not priced through.** A line under its MOQ
  turns amber and raises an alert instead of quoting a number a factory would
  refuse.
- **Only one next-break tip is shown at a time.** With equal per-kit quantities
  every line produces the identical sentence, which reads as noise; the row
  with the largest saving keeps it, the rest fall back to their setup note.
- **A theme is three colors.** `[data-theme]` supplies `--brand`, `--accent`,
  `--pop`; the light/dark mode layer derives every surface by `color-mix`-ing
  neutrals with `--brand`. That is why eleven palettes cost 33 hex values and
  cannot half-apply — no component hard-codes a hue.
- **`--pop` is scarce.** It marks highlight state, never chrome.
- **The site opens on the palette that matches the month.** A buyer shopping in
  November should land on Christmas, not on a generic default.
- **Nothing is transmitted.** The quote request form is client-side; the build
  persists to `localStorage` (wrapped in try/catch — private mode, blocked
  storage and quota failures must not take the page down).

## Themes

Signature · Christmas · Easter · Valentine's · St. Patrick's · Independence ·
Halloween · Harvest · Hanukkah · Lunar New Year · Winter Frost — each in light
and dark, chosen from the header picker and remembered per browser.
