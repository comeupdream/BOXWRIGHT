/* Boxwright Co. — product catalogue and pricing rules.
 *
 * Everything the quote engine needs lives here so pricing can be re-fit in one
 * place. Prices are per-unit at the smallest quantity break; volume breaks,
 * decoration and assembly are layered on in app.js.
 *
 * Load-bearing modelling notes:
 *  - `min` is a real minimum order quantity, not a suggestion. Sub-minimum
 *    lines are flagged rather than silently priced, because a factory would
 *    reject them.
 *  - `setup` is one-time tooling (a knit setup, a die, a mold). It is charged
 *    once per line, never per unit, and it is what makes tiny runs expensive.
 *  - `lead` is production days before assembly. The kit ships when its SLOWEST
 *    item is ready, so one embroidered varsity jacket sets the date for the
 *    whole package.
 */

const DECORATION = {
  none:       { id: 'none',       label: 'Blank — no decoration',      unit: 0.00, setup: 0,   note: 'Ships as-is' },
  screen:     { id: 'screen',     label: 'Screen print, 1 color',     unit: 0.85, setup: 45,  note: 'Best for flat cotton' },
  screen3:    { id: 'screen3',    label: 'Screen print, 3 color',     unit: 1.65, setup: 110, note: 'Separate screen per color' },
  embroidery: { id: 'embroidery', label: 'Embroidery', unit: 2.40, setup: 65, note: 'Digitizing included' },
  laser:      { id: 'laser',      label: 'Laser etch',                 unit: 1.75, setup: 55,  note: 'Permanent, single tone' },
  uv:         { id: 'uv',         label: 'Full-color UV',        unit: 1.20, setup: 30,  note: 'Photographic, any artwork' },
  deboss:     { id: 'deboss',     label: 'Deboss / emboss',      unit: 1.95, setup: 75,  note: 'Brass die, tonal finish' },
  enamel:     { id: 'enamel',     label: 'Soft-enamel mold',    unit: 0.00, setup: 95,  note: 'Mold fee, up to 5 colors' },
  diecut:     { id: 'diecut',     label: 'Die-cut, full color',        unit: 0.00, setup: 40,  note: 'Cut to your artwork' },
};

const CATEGORIES = [
  { id: 'apparel',     label: 'Apparel & outerwear', short: 'Apparel', blurb: 'Jackets, knits, headwear and bags people actually keep.' },
  { id: 'drinkware',   label: 'Drinkware', short: 'Drinkware',           blurb: 'Desk-side tumblers, bottles and ceramics.' },
  { id: 'desk',        label: 'Desk & paper', short: 'Desk & paper',        blurb: 'Notebooks, pens, mats and the small stationery bits.' },
  { id: 'play',        label: 'Puzzles & play', short: 'Puzzles & play',      blurb: 'Cubes, jigsaws, cards — the things that stay on a shelf.' },
  { id: 'smallgoods',  label: 'Pins, patches & tidbits', short: 'Pins & tidbits', blurb: 'Keychains, stickers, stamps, magnets, seals.' },
  { id: 'consumables', label: 'Food & drink', short: 'Food & drink',        blurb: 'Coffee, chocolate, cookies — the part that gets opened first.' },
  { id: 'tech',        label: 'Tech & power', short: 'Tech & power',        blurb: 'Speakers, banks, hubs and cables that survive a commute.' },
];

/* id, name, cat, base unit price, min qty, production lead days, allowed decoration ids, optional tooling setup */
const ITEMS = [
  // ── Apparel & outerwear ───────────────────────────────────────────────────
  { id: 'varsity',    cat: 'apparel', name: 'Wool-blend varsity jacket',    base: 88.00, min: 24, lead: 35, deco: ['embroidery', 'screen3'], note: 'Leather sleeves, chenille patch option' },
  { id: 'bomber',     cat: 'apparel', name: 'Satin bomber jacket',          base: 62.00, min: 24, lead: 30, deco: ['embroidery', 'screen'] },
  { id: 'softshell',  cat: 'apparel', name: 'Softshell zip jacket',         base: 54.00, min: 12, lead: 21, deco: ['embroidery', 'laser'] },
  { id: 'puffer',     cat: 'apparel', name: 'Recycled puffer vest',         base: 68.00, min: 12, lead: 25, deco: ['embroidery'] },
  { id: 'quarterzip', cat: 'apparel', name: 'Fleece quarter-zip',           base: 41.00, min: 12, lead: 18, deco: ['embroidery', 'screen'] },
  { id: 'hoodie',     cat: 'apparel', name: 'Heavyweight hoodie',           base: 34.00, min: 12, lead: 16, deco: ['embroidery', 'screen', 'screen3'] },
  { id: 'crewneck',   cat: 'apparel', name: 'Fleece crewneck sweatshirt',   base: 30.00, min: 12, lead: 16, deco: ['embroidery', 'screen', 'screen3'] },
  { id: 'tee',        cat: 'apparel', name: 'Heavyweight cotton tee',       base: 12.50, min: 24, lead: 12, deco: ['screen', 'screen3', 'embroidery'] },
  { id: 'polo',       cat: 'apparel', name: 'Performance polo',             base: 22.00, min: 12, lead: 14, deco: ['embroidery'] },
  { id: 'beanie',     cat: 'apparel', name: 'Cuffed knit beanie',           base: 11.00, min: 24, lead: 14, deco: ['embroidery'] },
  { id: 'cap',        cat: 'apparel', name: '6-panel cotton cap',           base: 13.50, min: 24, lead: 14, deco: ['embroidery'] },
  { id: 'socks',      cat: 'apparel', name: 'Custom knit crew socks',       base: 9.75,  min: 50, lead: 24, deco: ['none'], setup: 60, note: 'Pattern knit in, not printed' },
  { id: 'tote',       cat: 'apparel', name: 'Heavy canvas tote',            base: 9.20,  min: 24, lead: 14, deco: ['screen', 'screen3', 'embroidery'] },
  { id: 'backpack',   cat: 'apparel', name: 'Commuter backpack',            base: 46.00, min: 12, lead: 24, deco: ['embroidery', 'laser'] },
  { id: 'duffel',     cat: 'apparel', name: 'Weekender duffel',             base: 52.00, min: 12, lead: 24, deco: ['embroidery'] },
  { id: 'blanket',    cat: 'apparel', name: 'Sherpa throw blanket',         base: 27.00, min: 12, lead: 18, deco: ['embroidery'] },

  // ── Drinkware ─────────────────────────────────────────────────────────────
  { id: 'tumbler',    cat: 'drinkware', name: '20oz insulated tumbler',     base: 21.00, min: 24, lead: 15, deco: ['laser', 'uv'] },
  { id: 'bottle',     cat: 'drinkware', name: '32oz steel water bottle',    base: 24.00, min: 24, lead: 15, deco: ['laser', 'uv'] },
  { id: 'mug',        cat: 'drinkware', name: 'Glazed ceramic mug',         base: 11.50, min: 36, lead: 15, deco: ['uv'] },
  { id: 'campmug',    cat: 'drinkware', name: 'Enamel camp mug',            base: 13.00, min: 36, lead: 18, deco: ['uv'] },
  { id: 'pintglass',  cat: 'drinkware', name: 'Etched pint glass',          base: 8.40,  min: 36, lead: 14, deco: ['laser'] },
  { id: 'frenchpress',cat: 'drinkware', name: 'Glass french press',         base: 28.50, min: 12, lead: 18, deco: ['laser', 'uv'] },

  // ── Desk & paper ──────────────────────────────────────────────────────────
  { id: 'penmetal',   cat: 'desk', name: 'Machined aluminum pen',           base: 7.90,  min: 25,  lead: 12, deco: ['laser'] },
  { id: 'pengel',     cat: 'desk', name: 'Soft-touch gel pen',              base: 1.85,  min: 100, lead: 10, deco: ['uv', 'screen'] },
  { id: 'pencils',    cat: 'desk', name: 'Cedar pencil set of 6',           base: 6.50,  min: 25,  lead: 12, deco: ['uv'] },
  { id: 'notebook',   cat: 'desk', name: 'Hardcover dot-grid notebook',     base: 12.40, min: 25,  lead: 14, deco: ['deboss', 'uv', 'laser'] },
  { id: 'pocketbook', cat: 'desk', name: 'Softcover pocket notebooks (3)',  base: 8.20,  min: 25,  lead: 12, deco: ['deboss', 'uv'] },
  { id: 'deskmat',    cat: 'desk', name: 'Vegan leather desk mat',          base: 26.00, min: 25,  lead: 20, deco: ['deboss', 'uv'] },
  { id: 'mousepad',   cat: 'desk', name: 'Stitched-edge mouse pad',         base: 8.60,  min: 25,  lead: 14, deco: ['uv'] },
  { id: 'stickynote', cat: 'desk', name: 'Sticky note booklet',             base: 3.40,  min: 50,  lead: 10, deco: ['uv'] },
  { id: 'stamp',      cat: 'desk', name: 'Wood-handle rubber stamp',        base: 14.50, min: 10,  lead: 12, deco: ['none'], setup: 35, note: 'Custom die cut from your mark' },
  { id: 'waxseal',    cat: 'desk', name: 'Brass wax seal kit',              base: 18.00, min: 10,  lead: 16, deco: ['none'], setup: 55, note: 'Engraved head + wax sticks' },
  { id: 'cardholder', cat: 'desk', name: 'Leather card holder',             base: 19.50, min: 25,  lead: 18, deco: ['deboss', 'laser'] },
  { id: 'penciltin',  cat: 'desk', name: 'Slim steel pencil tin',           base: 5.90,  min: 25,  lead: 14, deco: ['uv', 'laser'] },

  // ── Puzzles & play ────────────────────────────────────────────────────────
  { id: 'cube',       cat: 'play', name: 'Speed cube puzzle (3×3)',         base: 9.40,  min: 25, lead: 16, deco: ['uv'], note: 'Six printable faces' },
  { id: 'jigsaw',     cat: 'play', name: 'Custom 500-piece jigsaw',         base: 16.80, min: 25, lead: 20, deco: ['uv'] },
  { id: 'cards',      cat: 'play', name: 'Custom deck of playing cards',    base: 7.25,  min: 50, lead: 18, deco: ['uv'] },
  { id: 'dice',       cat: 'play', name: 'Metal dice set in tin',           base: 15.00, min: 25, lead: 18, deco: ['laser'] },
  { id: 'fidget',     cat: 'play', name: 'Machined fidget slider',          base: 12.60, min: 25, lead: 18, deco: ['laser'] },
  { id: 'orbiter',    cat: 'play', name: 'Kinetic desk orbiter',            base: 22.00, min: 12, lead: 20, deco: ['laser'] },
  { id: 'chess',      cat: 'play', name: 'Travel magnetic chess set',       base: 19.40, min: 12, lead: 20, deco: ['laser', 'uv'] },

  // ── Pins, patches & tidbits ───────────────────────────────────────────────
  { id: 'pin',        cat: 'smallgoods', name: 'Soft-enamel lapel pin',     base: 2.35, min: 100, lead: 20, deco: ['enamel'] },
  { id: 'keyleather', cat: 'smallgoods', name: 'Leather keychain fob',      base: 6.40, min: 25,  lead: 14, deco: ['deboss', 'laser'] },
  { id: 'keymetal',   cat: 'smallgoods', name: 'Die-struck metal keychain', base: 4.10, min: 50,  lead: 20, deco: ['laser'], setup: 70, note: 'Struck from a custom mold' },
  { id: 'stickers',   cat: 'smallgoods', name: 'Die-cut vinyl sticker set (4)', base: 2.90, min: 50, lead: 10, deco: ['diecut'] },
  { id: 'patch',      cat: 'smallgoods', name: 'Embroidered iron-on patch', base: 3.20, min: 50,  lead: 22, deco: ['none'], setup: 55 },
  { id: 'magnets',    cat: 'smallgoods', name: 'Magnet set of 3',           base: 2.60, min: 50,  lead: 12, deco: ['uv'] },
  { id: 'lanyard',    cat: 'smallgoods', name: 'Woven lanyard + badge reel', base: 4.75, min: 50, lead: 18, deco: ['none'], setup: 45 },
  { id: 'carabiner',  cat: 'smallgoods', name: 'Anodized carabiner',        base: 3.90, min: 50,  lead: 14, deco: ['laser'] },
  { id: 'coasters',   cat: 'smallgoods', name: 'Cork-back coaster pair',    base: 5.60, min: 25,  lead: 12, deco: ['uv', 'laser'] },
  { id: 'opener',     cat: 'smallgoods', name: 'Cast iron bottle opener',   base: 5.25, min: 25,  lead: 16, deco: ['laser'] },
  { id: 'ornament',   cat: 'smallgoods', name: 'Brass keepsake ornament',   base: 7.80, min: 25,  lead: 18, deco: ['laser'], note: 'Dated edition — a holiday staple' },

  // ── Food & drink ──────────────────────────────────────────────────────────
  { id: 'coffee',     cat: 'consumables', name: 'Single-origin coffee, 12oz', base: 14.50, min: 12, lead: 10, deco: ['uv'], note: 'Roast-to-order, custom label' },
  { id: 'tea',        cat: 'consumables', name: 'Loose-leaf tea tin',       base: 12.00, min: 12, lead: 10, deco: ['uv'] },
  { id: 'chocolate',  cat: 'consumables', name: 'Bean-to-bar chocolate (2)', base: 9.80, min: 12, lead: 10, deco: ['uv'] },
  { id: 'cookies',    cat: 'consumables', name: 'Iced logo cookie tin',     base: 17.50, min: 12, lead: 12, deco: ['uv'] },
  { id: 'popcorn',    cat: 'consumables', name: 'Gourmet popcorn trio',     base: 11.40, min: 12, lead: 10, deco: ['uv'] },
  { id: 'hotsauce',   cat: 'consumables', name: 'Small-batch hot sauce',    base: 8.90,  min: 12, lead: 12, deco: ['uv'] },
  { id: 'trailmix',   cat: 'consumables', name: 'Trail mix jar',            base: 7.60,  min: 12, lead: 10, deco: ['uv'] },
  { id: 'candle',     cat: 'consumables', name: 'Soy candle, 8oz',          base: 16.20, min: 12, lead: 14, deco: ['uv', 'deboss'] },

  // ── Tech & power ──────────────────────────────────────────────────────────
  { id: 'speaker',    cat: 'tech', name: 'Bluetooth mini speaker',          base: 29.00, min: 12, lead: 20, deco: ['laser', 'uv'] },
  { id: 'earbuds',    cat: 'tech', name: 'Wireless earbuds + case',         base: 34.00, min: 12, lead: 22, deco: ['laser'] },
  { id: 'powerbank',  cat: 'tech', name: '10,000mAh power bank',            base: 26.50, min: 12, lead: 20, deco: ['laser', 'uv'] },
  { id: 'chargepad',  cat: 'tech', name: '3-in-1 wireless charge pad',      base: 31.00, min: 12, lead: 22, deco: ['laser', 'uv'] },
  { id: 'hub',        cat: 'tech', name: 'USB-C 6-port hub',                base: 27.00, min: 12, lead: 22, deco: ['laser'] },
  { id: 'webcam',     cat: 'tech', name: 'Webcam privacy covers (3)',       base: 1.90,  min: 50, lead: 12, deco: ['uv'] },
  { id: 'cable',      cat: 'tech', name: 'Braided 3-in-1 charge cable',     base: 8.40,  min: 25, lead: 16, deco: ['uv'] },
];

/* Quantity breaks apply to the ITEM price only — decoration stays flat per
 * unit, because a screen prints at the same speed whether you buy 50 or 5,000. */
const PRICE_BREAKS = [
  { min: 1000, mult: 0.70, label: '1,000+' },
  { min: 500,  mult: 0.76, label: '500+' },
  { min: 250,  mult: 0.82, label: '250+' },
  { min: 100,  mult: 0.88, label: '100+' },
  { min: 50,   mult: 0.94, label: '50+' },
  { min: 0,    mult: 1.00, label: 'under 50' },
];

const PACKAGING = [
  { id: 'rigid',  label: 'Rigid magnetic gift box',   price: 6.20, lead: 18, note: 'The one that gets photographed' },
  { id: 'crate',  label: 'Branded wood crate',        price: 11.50, lead: 20, note: 'Executive / milestone weight' },
  { id: 'kraft',  label: 'Kraft box + belly band',    price: 2.65, lead: 10, note: 'Recyclable, budget-friendly' },
  { id: 'mailer', label: 'Printed corrugated mailer', price: 3.40, lead: 12, note: 'Ships without an outer carton' },
  { id: 'muslin', label: 'Cotton muslin drawstring bag', price: 2.10, lead: 12, note: 'Soft goods, reusable' },
  { id: 'none',   label: 'No kit box — ship loose',   price: 0.00, lead: 0,  note: 'Bulk to one address only' },
];

const FILLS = [
  { id: 'crinkle', label: 'Colored crinkle fill',      price: 0.85 },
  { id: 'tissue',  label: 'Tissue wrap + wax seal sticker', price: 0.60 },
  { id: 'foam',    label: 'Die-cut foam insert',       price: 2.20 },
  { id: 'none',    label: 'No fill',                   price: 0.00 },
];

const SHIPPING = [
  { id: 'bulk',     label: 'Bulk, one address',          perKit: 0.90,  min: 120, note: 'You distribute internally' },
  { id: 'domestic', label: 'Drop-ship, US',    perKit: 9.40,  min: 0,   note: 'Address collection page included' },
  { id: 'intl',     label: 'Drop-ship, global',     perKit: 26.00, min: 0,   note: 'Duties/DDP estimated, not billed' },
  { id: 'pickup',   label: 'Pickup, our facility',       perKit: 0.00,  min: 0,   note: 'Los Angeles, CA' },
];

const ADDONS = [
  { id: 'card',     label: 'Custom printed insert card',   price: 0.95 },
  { id: 'handnote', label: 'Hand-written note per recipient', price: 1.75 },
  { id: 'ribbon',   label: 'Grosgrain ribbon + hang tag',  price: 1.10 },
  { id: 'sleeve',   label: 'Personalized name sleeve',     price: 1.40 },
];

/* Assembly is real labour: pick, inspect, fold, stage, seal, label. It gets
 * cheaper with volume because the line stops being re-set every batch. */
const KIT_RATES = [
  { min: 1000, rate: 2.65 },
  { min: 500,  rate: 3.10 },
  { min: 250,  rate: 3.75 },
  { min: 0,    rate: 4.50 },
];

const ORDER_DISCOUNTS = [
  { min: 50000, pct: 0.07 },
  { min: 25000, pct: 0.05 },
  { min: 10000, pct: 0.03 },
  { min: 0,     pct: 0.00 },
];

const RUSH_SURCHARGE = 0.18;   // on merchandise + assembly
const ASSEMBLY_DAYS = 5;       // +3 more over 500 kits
const RUSH_FLOOR_DAYS = 8;     // nothing ships faster than this, ever

const PRESETS = [
  {
    id: 'newhire',
    name: 'New-Hire Welcome',
    tagline: 'Day-one kit that beats a laptop sticker',
    kits: 100, packaging: 'rigid', fill: 'crinkle', shipping: 'domestic',
    addons: ['card'],
    lines: [
      { item: 'hoodie', deco: 'embroidery', qty: 1 },
      { item: 'tumbler', deco: 'laser', qty: 1 },
      { item: 'notebook', deco: 'deboss', qty: 1 },
      { item: 'penmetal', deco: 'laser', qty: 1 },
      { item: 'stickers', deco: 'diecut', qty: 1 },
      { item: 'tote', deco: 'screen', qty: 1 },
    ],
  },
  {
    id: 'holiday',
    name: 'Holiday Client Gift',
    tagline: 'Warm, edible, and impossible to re-gift',
    kits: 250, packaging: 'rigid', fill: 'tissue', shipping: 'domestic',
    addons: ['card', 'ribbon'],
    lines: [
      { item: 'blanket', deco: 'embroidery', qty: 1 },
      { item: 'campmug', deco: 'uv', qty: 1 },
      { item: 'coffee', deco: 'uv', qty: 1 },
      { item: 'chocolate', deco: 'uv', qty: 1 },
      { item: 'candle', deco: 'uv', qty: 1 },
      { item: 'ornament', deco: 'laser', qty: 1 },
    ],
  },
  {
    id: 'conference',
    name: 'Conference Swag Drop',
    tagline: 'Booth volume, per-unit discipline',
    kits: 500, packaging: 'kraft', fill: 'none', shipping: 'bulk',
    addons: [],
    lines: [
      { item: 'tee', deco: 'screen', qty: 1 },
      { item: 'cap', deco: 'embroidery', qty: 1 },
      { item: 'stickers', deco: 'diecut', qty: 1 },
      { item: 'pengel', deco: 'uv', qty: 2 },
      { item: 'carabiner', deco: 'laser', qty: 1 },
      { item: 'cube', deco: 'uv', qty: 1 },
    ],
  },
  {
    id: 'milestone',
    name: 'Executive Milestone',
    tagline: 'Five-year anniversaries and board gifts',
    kits: 50, packaging: 'crate', fill: 'foam', shipping: 'domestic',
    addons: ['handnote', 'sleeve'],
    lines: [
      { item: 'deskmat', deco: 'deboss', qty: 1 },
      { item: 'cardholder', deco: 'deboss', qty: 1 },
      { item: 'penmetal', deco: 'laser', qty: 1 },
      { item: 'waxseal', deco: 'none', qty: 1 },
      { item: 'chocolate', deco: 'uv', qty: 1 },
    ],
  },
  {
    id: 'field',
    name: 'Field Team Outfit',
    tagline: 'Cold-weather crews and site visits',
    kits: 150, packaging: 'mailer', fill: 'none', shipping: 'domestic',
    addons: ['card'],
    lines: [
      { item: 'softshell', deco: 'embroidery', qty: 1 },
      { item: 'beanie', deco: 'embroidery', qty: 1 },
      { item: 'socks', deco: 'none', qty: 1 },
      { item: 'bottle', deco: 'laser', qty: 1 },
      { item: 'patch', deco: 'none', qty: 2 },
    ],
  },
  {
    id: 'desk',
    name: 'Desk Refresh',
    tagline: 'Remote-team care package, no apparel sizing',
    kits: 200, packaging: 'mailer', fill: 'crinkle', shipping: 'domestic',
    addons: ['card'],
    lines: [
      { item: 'deskmat', deco: 'uv', qty: 1 },
      { item: 'mousepad', deco: 'uv', qty: 1 },
      { item: 'pocketbook', deco: 'deboss', qty: 1 },
      { item: 'penmetal', deco: 'laser', qty: 1 },
      { item: 'cube', deco: 'uv', qty: 1 },
      { item: 'magnets', deco: 'uv', qty: 1 },
    ],
  },
];

/* Seasonal palettes. Each theme supplies ink colors only — surface tokens come
 * from the light/dark mode layer and are tinted from --brand, so a new theme is
 * three colors, not thirty. */
const THEMES = [
  { id: 'signature',  label: 'Signature',      season: 'Year-round',      brand: '#1f6f5c', accent: '#c2703a', pop: '#e6b422' },
  { id: 'christmas',  label: 'Christmas',      season: 'Nov – Dec',       brand: '#b3162a', accent: '#1f6b3a', pop: '#e8d9b5' },
  { id: 'easter',     label: 'Easter',         season: 'Mar – Apr',       brand: '#c25b90', accent: '#5aa552', pop: '#efc75e' },
  { id: 'valentines', label: "Valentine's",    season: 'February',        brand: '#cf2e5b', accent: '#d98aa0', pop: '#8c2f4a' },
  { id: 'stpatricks', label: "St. Patrick's",  season: 'March',           brand: '#17794a', accent: '#c69214', pop: '#5aa552' },
  { id: 'july4',      label: 'Independence',   season: 'July',            brand: '#b02436', accent: '#24468c', pop: '#9aa7bd' },
  { id: 'halloween',  label: 'Halloween',      season: 'October',         brand: '#d2691e', accent: '#6b3fa0', pop: '#3f3a4d' },
  { id: 'harvest',    label: 'Harvest',        season: 'Sep – Nov',       brand: '#a8541f', accent: '#7b8a3f', pop: '#c99b3f' },
  { id: 'hanukkah',   label: 'Hanukkah',       season: 'Dec',             brand: '#1f5fa8', accent: '#7d8794', pop: '#cfd8e3' },
  { id: 'lunar',      label: 'Lunar New Year', season: 'Jan – Feb',       brand: '#c0272d', accent: '#c9a227', pop: '#e4b95b' },
  { id: 'frost',      label: 'Winter Frost',   season: 'Dec – Feb',       brand: '#2f7d95', accent: '#8fa6b8', pop: '#cfe3ea' },
];
