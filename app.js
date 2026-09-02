/* ===========================================================================
   Boxwright Co. — configurator + quote engine
   ---------------------------------------------------------------------------
   No framework, no build step, no dependencies. Three ideas hold it together:

     1. ONE state object is the truth; every render reads from it.
     2. `quote(state)` is pure — it takes state, returns a full costed
        breakdown, and touches no DOM. Everything on screen is a view of it.
     3. Line rows are built ONCE and mutated in place. Re-rendering the whole
        list on every keystroke would steal focus out of the select the user
        is in — which is the entire interface here.
   =========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const byId = (list, id) => list.find((x) => x.id === id);
  const ITEM = (id) => ITEMS.find((i) => i.id === id);

  const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const int = (n) => Math.round(n).toLocaleString('en-US');
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const icon = (name, size) => `<svg width="${size || 16}" height="${size || 16}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const STORE_BUILD = 'boxwright.build.v2';
  const STORE_THEME = 'boxwright.theme.v1';
  const STORE_MODE = 'boxwright.mode.v1';

  /* ── State ─────────────────────────────────────────────────────────────── */
  let uid = 0;
  const newUid = () => 'l' + ++uid;

  const state = {
    kits: 100,
    occasion: 'Employee onboarding',
    shipping: 'domestic',
    rush: false,
    packaging: 'rigid',
    fill: 'crinkle',
    addons: ['card'],
    budget: 85,
    lines: [],
  };

  function lineFrom(itemId, decoId, qty) {
    const it = ITEM(itemId);
    return { uid: newUid(), cat: it.cat, item: it.id, deco: decoId && it.deco.includes(decoId) ? decoId : it.deco[0], qty: qty || 1 };
  }

  /* ── Pricing rules ─────────────────────────────────────────────────────── */
  const breakFor = (units) => PRICE_BREAKS.find((b) => units >= b.min);
  const nextBreakFor = (units) => {
    const above = PRICE_BREAKS.filter((b) => b.min > units).sort((a, b) => a.min - b.min);
    return above[0] || null;
  };
  const kitRate = (kits) => KIT_RATES.find((k) => kits >= k.min).rate;
  const discountFor = (subtotal) => ORDER_DISCOUNTS.find((d) => subtotal >= d.min);

  /* The whole quote, from state. Pure — no DOM, no side effects. */
  function quote(s) {
    const kits = Math.max(1, s.kits | 0);
    const pkg = byId(PACKAGING, s.packaging) || PACKAGING[0];
    const fill = byId(FILLS, s.fill) || FILLS[3];
    const ship = byId(SHIPPING, s.shipping) || SHIPPING[0];

    const lines = s.lines.map((l) => {
      const it = ITEM(l.item);
      const deco = DECORATION[l.deco] || DECORATION.none;
      const units = l.qty * kits;
      const br = breakFor(units);
      const nb = nextBreakFor(units);
      const unitPrice = it.base * br.mult;
      const goods = units * unitPrice;
      const list = units * it.base;
      const decoCost = units * deco.unit;
      const setup = (deco.setup || 0) + (it.setup || 0);
      return {
        ref: l, item: it, deco, units, br, unitPrice, goods, list, decoCost, setup,
        total: goods + decoCost + setup,
        underMin: units < it.min,
        shortBy: Math.max(0, it.min - units),
        nextBreak: nb ? { label: nb.label, need: nb.min - units, unitPrice: it.base * nb.mult } : null,
      };
    });

    const goods = lines.reduce((a, l) => a + l.goods, 0);
    const listGoods = lines.reduce((a, l) => a + l.list, 0);
    const decoration = lines.reduce((a, l) => a + l.decoCost, 0);
    const setups = lines.reduce((a, l) => a + l.setup, 0);
    const breakSavings = listGoods - goods;
    const merch = goods + decoration + setups;

    const packaging = (pkg.price + fill.price) * kits;
    const addons = s.addons.reduce((a, id) => { const x = byId(ADDONS, id); return a + (x ? x.price * kits : 0); }, 0);
    const assembly = kitRate(kits) * kits;
    const freight = Math.max(ship.perKit * kits, lines.length ? ship.min : 0);
    const rush = s.rush ? RUSH_SURCHARGE * (merch + assembly) : 0;
    const disc = discountFor(merch);
    const discount = merch * disc.pct;

    const total = merch + packaging + addons + assembly + freight + rush - discount;

    /* Lead time: the slowest thing in the box sets the date. */
    const slowest = lines.reduce((a, l) => Math.max(a, l.item.lead), 0);
    const slowItem = lines.slice().sort((a, b) => b.item.lead - a.item.lead)[0];
    const assemblyDays = kits > 500 ? ASSEMBLY_DAYS + 3 : ASSEMBLY_DAYS;
    let lead = lines.length ? Math.max(slowest, pkg.lead) + assemblyDays : 0;
    if (s.rush && lead) lead = Math.max(RUSH_FLOOR_DAYS, Math.ceil(lead * 0.55));
    const transit = { bulk: 3, domestic: 5, intl: 12, pickup: 0 }[ship.id] || 0;
    const inHands = lines.length ? addDays(new Date(), lead + transit) : null;

    /* Alerts are things a factory would reject, not style opinions. */
    const alerts = [];
    if (!lines.length) alerts.push('Your kit is empty — add at least one item to price it.');
    if (kits < 12) alerts.push('Minimum program size is 12 kits.');
    lines.filter((l) => l.underMin).forEach((l) => {
      alerts.push(`${l.item.name} has a ${int(l.item.min)}-unit factory minimum — you're ${int(l.shortBy)} short.`);
    });
    if (pkg.id === 'none' && ship.id !== 'bulk' && ship.id !== 'pickup') {
      alerts.push('Loose goods can only ship in bulk to one address — pick a kit box for drop-shipping.');
    }
    if (s.rush && slowest >= 30) {
      alerts.push(`Rush cannot beat ${slowItem.item.name}'s factory schedule — expect the tail of the window.`);
    }

    return {
      kits, pkg, fill, ship, lines,
      goods, decoration, setups, breakSavings, merch,
      packaging, addons, assembly, freight, rush, discount, discountPct: disc.pct,
      total, perKit: total / kits,
      units: lines.reduce((a, l) => a + l.units, 0),
      lead, transit, inHands, slowItem: slowItem ? slowItem.item : null,
      alerts,
    };
  }

  function addDays(d, n) { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  /* ── Persistence ───────────────────────────────────────────────────────── */
  function save() {
    try {
      localStorage.setItem(STORE_BUILD, JSON.stringify({
        kits: state.kits, occasion: state.occasion, shipping: state.shipping, rush: state.rush,
        packaging: state.packaging, fill: state.fill, addons: state.addons, budget: state.budget,
        lines: state.lines.map((l) => ({ item: l.item, deco: l.deco, qty: l.qty })),
      }));
    } catch (e) { /* private mode, quota, blocked storage — the page still works */ }
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_BUILD); } catch (e) { return false; }
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      if (!d || !Array.isArray(d.lines)) return false;
      state.kits = d.kits || 100;
      state.occasion = d.occasion || state.occasion;
      state.shipping = d.shipping || state.shipping;
      state.rush = !!d.rush;
      state.packaging = d.packaging || state.packaging;
      state.fill = d.fill || state.fill;
      state.addons = Array.isArray(d.addons) ? d.addons : state.addons;
      state.budget = typeof d.budget === 'number' ? d.budget : state.budget;
      state.lines = d.lines.filter((l) => ITEM(l.item)).map((l) => lineFrom(l.item, l.deco, l.qty));
      return state.lines.length > 0;
    } catch (e) { return false; }
  }

  /* ── Theme ─────────────────────────────────────────────────────────────── */
  let themeMeta = null;
  function applyTheme(id) {
    const t = byId(THEMES, id) || THEMES[0];
    document.documentElement.dataset.theme = t.id;
    $('#themeBtnLabel').textContent = t.label;
    $$('#themeList .theme-opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.theme === t.id)));
    if (!themeMeta) { themeMeta = el('meta'); themeMeta.name = 'theme-color'; document.head.appendChild(themeMeta); }
    themeMeta.content = t.brand;
    try { localStorage.setItem(STORE_THEME, t.id); } catch (e) {}
  }
  function applyMode(mode) {
    if (mode === 'system') delete document.documentElement.dataset.mode;
    else document.documentElement.dataset.mode = mode;
    $$('.mode-row button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    try { localStorage.setItem(STORE_MODE, mode); } catch (e) {}
  }
  function buildThemeMenu() {
    const list = $('#themeList');
    THEMES.forEach((t) => {
      const b = el('button', 'theme-opt');
      b.type = 'button'; b.dataset.theme = t.id; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.innerHTML = `<span class="theme-dots" aria-hidden="true">
          <i style="background:${t.brand}"></i><i style="background:${t.accent}"></i><i style="background:${t.pop}"></i>
        </span>
        <span><b>${t.label}</b><small>${t.season}</small></span>
        <svg class="tick" aria-hidden="true"><use href="#i-check"/></svg>`;
      b.addEventListener('click', () => { applyTheme(t.id); closeMenu(); toast(`${t.label} palette applied`); });
      list.appendChild(b);
    });
    $$('.mode-row button').forEach((b) => b.addEventListener('click', () => applyMode(b.dataset.mode)));
  }
  function openMenu() { $('#themeMenu').hidden = false; $('#themeBtn').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { $('#themeMenu').hidden = true; $('#themeBtn').setAttribute('aria-expanded', 'false'); }

  /* ── Toast ─────────────────────────────────────────────────────────────── */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
  }

  /* ── Select helpers ────────────────────────────────────────────────────── */
  function fillSelect(sel, options, value) {
    sel.innerHTML = '';
    options.forEach((o) => {
      const op = el('option');
      op.value = o.value; op.textContent = o.label;
      sel.appendChild(op);
    });
    sel.value = value;
    if (sel.selectedIndex < 0 && options.length) sel.value = options[0].value;
  }

  const QTY_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];  /* per kit — labelled by the column caption */

  /* ── Line rows (built once, mutated in place) ──────────────────────────── */
  const nodes = new Map();

  function buildLineNode(line) {
    const row = el('div', 'line');
    row.dataset.uid = line.uid;
    row.innerHTML = `
      <span class="line-ic" aria-hidden="true">${icon('box', 20)}</span>
      <div class="field"><label class="sr">Category</label><select class="control js-cat"></select></div>
      <div class="field"><label class="sr">Item</label><select class="control js-item"></select></div>
      <div class="field"><label class="sr">Decoration</label><select class="control js-deco"></select></div>
      <div class="field"><label class="sr">Quantity per kit</label><select class="control js-qty"></select></div>
      <div class="line-total js-total">—</div>
      <button class="line-x js-del" type="button" title="Remove this item" aria-label="Remove item">${icon('x', 15)}</button>
      <div class="line-note js-note" hidden></div>`;

    const cat = $('.js-cat', row), item = $('.js-item', row), deco = $('.js-deco', row), qty = $('.js-qty', row);

    fillSelect(cat, CATEGORIES.map((c) => ({ value: c.id, label: c.short || c.label })), line.cat);
    refreshItems(row, line, line.item);
    fillSelect(qty, QTY_STEPS.map((n) => ({ value: String(n), label: '×' + n })), String(line.qty));

    cat.addEventListener('change', () => {
      line.cat = cat.value;
      const first = ITEMS.filter((i) => i.cat === line.cat)[0];
      line.item = first.id;
      refreshItems(row, line, line.item);
      render();
    });
    item.addEventListener('change', () => { line.item = item.value; refreshDeco(row, line); render(); });
    deco.addEventListener('change', () => { line.deco = deco.value; render(); });
    qty.addEventListener('change', () => { line.qty = parseInt(qty.value, 10) || 1; render(); });
    $('.js-del', row).addEventListener('click', () => {
      state.lines = state.lines.filter((l) => l.uid !== line.uid);
      row.style.opacity = '0';
      setTimeout(() => { nodes.delete(line.uid); row.remove(); render(); }, 120);
    });

    nodes.set(line.uid, { row, cat, item, deco, qty, total: $('.js-total', row), note: $('.js-note', row), ic: $('.line-ic', row) });
    return row;
  }

  function refreshItems(row, line, want) {
    const pool = ITEMS.filter((i) => i.cat === line.cat);
    fillSelect($('.js-item', row), pool.map((i) => ({ value: i.id, label: i.name })), want);
    line.item = $('.js-item', row).value;
    refreshDeco(row, line);
  }

  function refreshDeco(row, line) {
    const it = ITEM(line.item);
    const opts = it.deco.map((d) => {
      const dec = DECORATION[d];
      const cost = dec.unit ? ` +${money(dec.unit)}/u` : (dec.setup ? ' · setup only' : '');
      return { value: d, label: dec.label + cost };
    });
    if (!it.deco.includes('none') && it.deco.length && !it.setup) {
      opts.push({ value: 'none', label: DECORATION.none.label });
    }
    fillSelect($('.js-deco', row), opts, it.deco.includes(line.deco) || line.deco === 'none' ? line.deco : it.deco[0]);
    line.deco = $('.js-deco', row).value;
  }

  /* Keep the DOM list in step with state.lines without rebuilding rows. */
  function syncLines() {
    const host = $('#lines');
    const empty = $('#linesEmpty');
    state.lines.forEach((line) => {
      if (!nodes.has(line.uid)) host.appendChild(buildLineNode(line));
    });
    Array.from(nodes.keys()).forEach((k) => {
      if (!state.lines.some((l) => l.uid === k)) { nodes.get(k).row.remove(); nodes.delete(k); }
    });
    // keep DOM order matching state order
    state.lines.forEach((l) => host.appendChild(nodes.get(l.uid).row));

    if (!state.lines.length) {
      if (!empty) {
        const e = el('div', 'lines-empty', 'Nothing in the box yet. Add an item, load a package above, or hit <b>Surprise me</b>.');
        e.id = 'linesEmpty';
        host.appendChild(e);
      }
    } else if (empty) empty.remove();
  }

  /* ── Render ────────────────────────────────────────────────────────────── */
  function render() {
    syncLines();
    const q = quote(state);

    /* Per-line figures. Only the single most valuable break tip is shown: with
       equal per-kit quantities every line would otherwise repeat the same
       sentence, which reads as noise rather than advice. */
    let bestTip = null, bestSave = 0;
    q.lines.forEach((ql) => {
      if (ql.underMin || !ql.nextBreak || ql.nextBreak.need > ql.units * 1.5) return;
      const save = ql.units * (ql.unitPrice - ql.nextBreak.unitPrice);
      if (save > bestSave) { bestSave = save; bestTip = ql.ref.uid; }
    });

    q.lines.forEach((ql) => {
      const n = nodes.get(ql.ref.uid);
      if (!n) return;
      n.ic.innerHTML = icon(ql.item.cat, 20);
      n.total.innerHTML = `${money(ql.total)}<small>${int(ql.units)} units · ${money(ql.unitPrice + ql.deco.unit)}/ea</small>`;
      n.row.classList.toggle('is-warn', ql.underMin);

      let note = '', cls = 'line-note';
      if (ql.underMin) {
        cls += ' is-warn';
        note = `${icon('alert', 12)} Factory minimum is ${int(ql.item.min)} units — add ${int(ql.shortBy)} more (about ×${Math.ceil(ql.item.min / q.kits)} per kit).`;
      } else if (bestTip === ql.ref.uid) {
        cls += ' is-tip';
        note = `${icon('trend', 12)} ${int(ql.nextBreak.need)} more units reaches the ${ql.nextBreak.label} break — ${money(ql.nextBreak.unitPrice)}/unit instead of ${money(ql.unitPrice)}.`;
      } else if (ql.setup) {
        note = `${icon('tag', 12)} Includes ${money(ql.setup)} one-time setup${ql.item.note ? ' · ' + ql.item.note : ''}.`;
      } else if (ql.item.note) {
        note = `${icon('sparkle', 12)} ${ql.item.note}`;
      }
      n.note.className = cls;
      n.note.innerHTML = note;
      n.note.hidden = !note;
    });

    $('#lineCount').textContent = state.lines.length
      ? `${state.lines.length} item${state.lines.length > 1 ? 's' : ''} · ${int(q.units)} units total`
      : 'Nothing added yet';

    renderQuote(q);
    renderInsight(q);
    renderSheet(q);
    save();
  }

  function qrow(label, value, cls, hint) {
    return `<div class="qrow ${cls || ''}"><span>${label}${hint ? ` <em>${hint}</em>` : ''}</span><b>${value}</b></div>`;
  }

  function renderQuote(q) {
    $('#perKit').textContent = state.lines.length ? money(q.perKit) : '$0.00';
    $('#perKitSub').textContent = state.lines.length ? `landed, all-in` : 'add items to price the kit';
    $('#totalLabel').textContent = `Program total — ${int(q.kits)} kits`;
    $('#grandTotal').textContent = money0(q.total);

    let rows = '';
    rows += qrow('Merchandise', money(q.goods), '', `${int(q.units)} units`);
    if (q.decoration) rows += qrow('Decoration', money(q.decoration), '', 'per unit');
    if (q.setups) rows += qrow('Setup &amp; tooling', money(q.setups), '', 'one-time');
    if (q.breakSavings > 0.5) rows += qrow('Quantity breaks applied', '−' + money(q.breakSavings), 'qrow--save');
    rows += qrow('Goods subtotal', money(q.merch), 'qrow--sub');
    rows += qrow('Kit packaging', money(q.packaging), '', `${q.pkg.label.split(' ')[0].toLowerCase()} + fill`);
    if (q.addons) rows += qrow('Finishing touches', money(q.addons), '');
    rows += qrow('Assembly &amp; QC', money(q.assembly), '', money(kitRate(q.kits)) + '/kit');
    rows += qrow('Freight', q.freight ? money(q.freight) : 'included', '', q.ship.id === 'pickup' ? 'pickup' : money(q.ship.perKit) + '/kit');
    if (q.rush) rows += qrow('Rush surcharge', '+' + money(q.rush), 'qrow--rush', '18%');
    if (q.discount) rows += qrow('Program discount', '−' + money(q.discount), 'qrow--save', Math.round(q.discountPct * 100) + '%');
    rows += qrow('Program total', money0(q.total), 'qrow--total');
    $('#quoteRows').innerHTML = rows;

    /* Alerts */
    $('#alerts').innerHTML = q.alerts.map((a) => `<div class="alert">${icon('alert', 14)}<span>${a}</span></div>`).join('');

    /* Meta strip */
    const meta = [];
    if (state.lines.length) {
      meta.push(`<div class="meta-row">${icon('clock')}<span>Production lead</span><b>${q.lead} days${state.rush ? ' (rush)' : ''}</b></div>`);
      meta.push(`<div class="meta-row">${icon('calendar')}<span>Est. in hands</span><b>${fmtDate(q.inHands)}</b></div>`);
      meta.push(`<div class="meta-row">${icon('truck')}<span>${q.ship.label}</span><b>${q.ship.id === 'pickup' ? 'Los Angeles' : '+' + q.transit + 'd transit'}</b></div>`);
      if (q.slowItem) meta.push(`<div class="meta-row">${icon('shield')}<span>Schedule set by</span><b>${q.slowItem.name.split(' ').slice(-2).join(' ')}</b></div>`);
    }
    $('#quoteMeta').innerHTML = meta.join('');

    /* Budget bar */
    const target = state.budget;
    const bar = $('#budgetBar'), note = $('#budgetNote');
    if (!target || !state.lines.length) {
      bar.firstElementChild.style.width = '0%';
      bar.classList.remove('is-over');
      note.className = 'budget-note';
      note.innerHTML = '<span>Set a target to track against.</span>';
    } else {
      const pct = Math.min(100, (q.perKit / target) * 100);
      bar.firstElementChild.style.width = pct + '%';
      const over = q.perKit > target;
      bar.classList.toggle('is-over', over);
      note.className = 'budget-note ' + (over ? 'is-over' : 'is-under');
      const delta = Math.abs(q.perKit - target);
      note.innerHTML = `<span>${over ? 'Over target by' : 'Under target by'}</span><b>${money(delta)} / kit · ${money0(delta * q.kits)} program</b>`;
    }
  }

  const KIT_TIERS = [25, 50, 100, 250, 500, 1000, 2500];

  /* What the buyer really wants to know: does going one size up pay for itself?
     Answered by costing the whole program again at the next tier. */
  function renderInsight(q) {
    const box = $('#insight');
    const next = KIT_TIERS.find((t) => t > state.kits);
    if (!state.lines.length || !next) { box.hidden = true; return; }
    const alt = quote(Object.assign({}, state, { kits: next }));
    const drop = q.perKit - alt.perKit;
    if (drop < 0.5) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<span>${icon('trend', 14)}<span>At <b>${int(next)} kits</b> the landed cost falls to <b>${money(alt.perKit)}</b> per kit — <b>${money(drop)}</b> less each, on ${int(next - q.kits)} more kits.</span></span>`;
    const btn = el('button', null, `Price ${int(next)} kits`);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      state.kits = next;
      syncControls();
      render();
      toast(`Repriced at ${int(next)} kits`);
    });
    box.appendChild(btn);
  }

  function renderSheet(q) {
    $('#sheetSub').textContent = `${state.occasion} · ${int(q.kits)} kits · ${q.pkg.label}`;
    $('#sheetRef').textContent = 'REF ' + refCode();
    $('#sheetLines').innerHTML = q.lines.length
      ? q.lines.map((l) => `<div class="sheet-line">
          <span>${l.item.name}<small>${l.deco.label} · ×${l.ref.qty} per kit · ${int(l.units)} units${l.setup ? ' · ' + money(l.setup) + ' setup' : ''}</small></span>
          <b>${money(l.total)}</b></div>`).join('')
      : '<p style="color:var(--ink-3);font-size:13px">No items configured yet.</p>';

    const t = [];
    t.push(['Goods, decoration &amp; setup', money(q.merch)]);
    t.push(['Packaging &amp; finishing', money(q.packaging + q.addons)]);
    t.push(['Assembly &amp; QC', money(q.assembly)]);
    t.push(['Freight — ' + q.ship.label, money(q.freight)]);
    if (q.rush) t.push(['Rush surcharge', '+' + money(q.rush)]);
    if (q.discount) t.push(['Program discount', '−' + money(q.discount)]);
    $('#sheetTotals').innerHTML =
      t.map(([k, v]) => `<div class="qrow"><span>${k}</span><b>${v}</b></div>`).join('') +
      `<div class="qrow qrow--total"><span>Program total</span><b>${money0(q.total)}</b></div>` +
      `<div class="qrow"><span>Per kit, landed</span><b>${money(q.perKit)}</b></div>` +
      (q.inHands ? `<div class="qrow"><span>Estimated in hands</span><b>${fmtDate(q.inHands)}</b></div>` : '');
  }

  /* A stable-looking reference derived from the build, so the same kit shows
     the same ref rather than flickering a new number on every keystroke. */
  function refCode() {
    const seed = state.lines.map((l) => l.item + l.qty).join('') + state.kits + state.packaging;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const d = new Date();
    return 'BW-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(h % 9000 + 1000);
  }

  /* ── Static sections ───────────────────────────────────────────────────── */
  function presetState(p) {
    return {
      kits: p.kits, occasion: state.occasion, shipping: p.shipping, rush: false,
      packaging: p.packaging, fill: p.fill, addons: p.addons, budget: 0,
      lines: p.lines.map((l) => lineFrom(l.item, l.deco, l.qty)),
    };
  }

  function loadPreset(p) {
    state.kits = p.kits;
    state.shipping = p.shipping;
    state.packaging = p.packaging;
    state.fill = p.fill;
    state.addons = p.addons.slice();
    state.rush = false;
    state.lines = p.lines.map((l) => lineFrom(l.item, l.deco, l.qty));
    nodes.forEach((n) => n.row.remove());
    nodes.clear();
    syncControls();
    render();
    toast(`${p.name} loaded — ${p.lines.length} items, ${int(p.kits)} kits`);
    document.getElementById('configure').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPresets() {
    const grid = $('#presetGrid');
    PRESETS.forEach((p) => {
      const q = quote(presetState(p));
      const card = el('button', 'preset');
      card.type = 'button';
      card.innerHTML = `
        <div class="preset-top"><h3>${p.name}</h3><span class="tag">${int(p.kits)} kits</span></div>
        <p>${p.tagline}</p>
        <div class="preset-chips">${p.lines.map((l) => `<span>${ITEM(l.item).name}</span>`).join('')}</div>
        <div class="preset-foot"><b>${money(q.perKit)} <span style="font-size:11px;color:var(--ink-3);font-family:var(--sans)">/ kit</span></b><em>Load package →</em></div>`;
      card.addEventListener('click', () => loadPreset(p));
      grid.appendChild(card);
    });

    $('#footPresets').innerHTML = PRESETS.map((p) => `<li><a href="#configure" data-preset="${p.id}">${p.name}</a></li>`).join('');
    $$('#footPresets a').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      loadPreset(byId(PRESETS, a.dataset.preset));
    }));
    $('#footCats').innerHTML = CATEGORIES.map((c) => `<li><a href="#catalog" data-cat="${c.id}">${c.label}</a></li>`).join('');
    $$('#footCats a').forEach((a) => a.addEventListener('click', () => setFilter(a.dataset.cat)));
  }

  function renderHero() {
    const p = byId(PRESETS, 'holiday');
    const q = quote(presetState(p));
    $('#heroCardName').textContent = p.name;
    $('#heroCardItems').innerHTML = q.lines.map((l) => `
      <div class="kit-item">
        <span class="ic" aria-hidden="true">${icon(l.item.cat, 18)}</span>
        <span><b>${l.item.name}</b><small>${l.deco.label}</small></span>
        <span class="amt">×${l.ref.qty}</span>
      </div>`).join('');
    $('#heroCardMeta').textContent = `per kit, landed · ${int(p.kits)} kits`;
    $('#heroCardPrice').textContent = money(q.perKit);
    $('#heroCardLoad').addEventListener('click', () => loadPreset(p));
  }

  let filter = 'all';
  function setFilter(cat) {
    filter = cat;
    $$('#catFilters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)));
    renderCatalog();
  }
  function renderCatalog() {
    const grid = $('#catalogGrid');
    const pool = filter === 'all' ? ITEMS : ITEMS.filter((i) => i.cat === filter);
    grid.innerHTML = pool.map((i) => {
      const cat = byId(CATEGORIES, i.cat);
      const decoLabel = DECORATION[i.deco[0]].label.split(' —')[0];
      return `<article class="prod">
        <span class="prod-ic" aria-hidden="true">${icon(i.cat, 20)}</span>
        <span class="cat">${cat.label}</span>
        <h4>${i.name}</h4>
        <p class="desc">${i.note || decoLabel + ' · min ' + int(i.min) + ' units'}</p>
        <div class="prod-spec"><span>${i.lead}d lead</span><span>min ${int(i.min)}</span></div>
        <div class="prod-foot">
          <b>${money(i.base)}<small>/unit</small></b>
          <button class="add-btn" type="button" data-add="${i.id}">Add</button>
        </div>
      </article>`;
    }).join('');
    $$('#catalogGrid [data-add]').forEach((b) => b.addEventListener('click', () => {
      const it = ITEM(b.dataset.add);
      const existing = state.lines.find((l) => l.item === it.id);
      if (existing) {
        existing.qty = Math.min(24, existing.qty + 1);
        const n = nodes.get(existing.uid);
        if (n) n.qty.value = String(existing.qty);
        toast(`${it.name} — now ×${existing.qty} per kit`);
      } else {
        state.lines.push(lineFrom(it.id, it.deco[0], 1));
        toast(`${it.name} added to your kit`);
      }
      b.textContent = 'Added'; b.classList.add('is-added');
      setTimeout(() => { b.textContent = 'Add'; b.classList.remove('is-added'); }, 1100);
      render();
    }));
  }
  function buildFilters() {
    const host = $('#catFilters');
    const mk = (id, label) => {
      const b = el('button', 'chip', label);
      b.type = 'button'; b.dataset.cat = id;
      b.setAttribute('aria-pressed', String(id === 'all'));
      b.addEventListener('click', () => setFilter(id));
      return b;
    };
    host.appendChild(mk('all', 'Everything'));
    CATEGORIES.forEach((c) => host.appendChild(mk(c.id, c.label)));
  }

  /* ── Controls ──────────────────────────────────────────────────────────── */
  function syncControls() {
    const kitsSel = $('#kitsSel'), kitsCustom = $('#kitsCustom');
    const preset = Array.from(kitsSel.options).some((o) => o.value === String(state.kits));
    kitsSel.value = preset ? String(state.kits) : 'custom';
    kitsCustom.hidden = preset;
    if (!preset) kitsCustom.value = state.kits;

    $('#occasionSel').value = state.occasion;
    $('#shipSel').value = state.shipping;
    $('#pkgSel').value = state.packaging;
    $('#fillSel').value = state.fill;
    $('#rushChk').checked = state.rush;
    $('#rushLabel').textContent = state.rush ? 'Rush' : 'Standard';
    $('#budgetInput').value = state.budget || '';
    $$('#addonList input').forEach((i) => { i.checked = state.addons.includes(i.value); });
    updateNotes();
  }
  function updateNotes() {
    const ship = byId(SHIPPING, state.shipping);
    $('#shipNote').textContent = ship ? ship.note : '';
    const pkg = byId(PACKAGING, state.packaging);
    $('#pkgNote').textContent = pkg ? pkg.note : '';
  }

  function wireControls() {
    fillSelect($('#shipSel'), SHIPPING.map((s) => ({ value: s.id, label: `${s.label} · ${s.perKit ? money(s.perKit) : 'no charge'}` })), state.shipping);
    fillSelect($('#pkgSel'), PACKAGING.map((p) => ({ value: p.id, label: `${p.label} · ${p.price ? money(p.price) : 'no charge'}` })), state.packaging);
    fillSelect($('#fillSel'), FILLS.map((f) => ({ value: f.id, label: `${f.label}${f.price ? ' · ' + money(f.price) : ''}` })), state.fill);

    $('#addonList').innerHTML = ADDONS.map((a) => `
      <label class="check"><input type="checkbox" value="${a.id}"><span>${a.label}</span><b>+${money(a.price)}/kit</b></label>`).join('');
    $$('#addonList input').forEach((i) => i.addEventListener('change', () => {
      state.addons = $$('#addonList input:checked').map((x) => x.value);
      render();
    }));

    const kitsSel = $('#kitsSel'), kitsCustom = $('#kitsCustom');
    kitsSel.addEventListener('change', () => {
      if (kitsSel.value === 'custom') {
        kitsCustom.hidden = false;
        kitsCustom.value = state.kits;
        kitsCustom.focus();
      } else {
        kitsCustom.hidden = true;
        state.kits = parseInt(kitsSel.value, 10);
        render();
      }
    });
    kitsCustom.addEventListener('input', () => {
      const v = parseInt(kitsCustom.value, 10);
      state.kits = isNaN(v) ? 1 : Math.max(1, Math.min(100000, v));
      render();
    });

    $('#occasionSel').addEventListener('change', (e) => { state.occasion = e.target.value; render(); });
    $('#shipSel').addEventListener('change', (e) => { state.shipping = e.target.value; updateNotes(); render(); });
    $('#pkgSel').addEventListener('change', (e) => { state.packaging = e.target.value; updateNotes(); render(); });
    $('#fillSel').addEventListener('change', (e) => { state.fill = e.target.value; render(); });
    $('#rushChk').addEventListener('change', (e) => {
      state.rush = e.target.checked;
      $('#rushLabel').textContent = state.rush ? 'Rush' : 'Standard';
      render();
    });
    $('#budgetInput').addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      state.budget = isNaN(v) ? 0 : v;
      render();
    });

    $('#addLine').addEventListener('click', () => {
      const cat = CATEGORIES[state.lines.length % CATEGORIES.length].id;
      const pool = ITEMS.filter((i) => i.cat === cat && !state.lines.some((l) => l.item === i.id));
      const pick = pool[0] || ITEMS.find((i) => !state.lines.some((l) => l.item === i.id)) || ITEMS[0];
      state.lines.push(lineFrom(pick.id, pick.deco[0], 1));
      render();
      const n = nodes.get(state.lines[state.lines.length - 1].uid);
      if (n) n.cat.focus();
    });

    $('#clearLines').addEventListener('click', () => {
      if (!state.lines.length) return;
      state.lines = [];
      render();
      toast('Kit cleared');
    });

    $('#surpriseBtn').addEventListener('click', () => {
      const pickFrom = (cat) => {
        const pool = ITEMS.filter((i) => i.cat === cat);
        return pool[Math.floor(Math.random() * pool.length)];
      };
      const cats = ['apparel', 'drinkware', 'desk', 'play', 'smallgoods', 'consumables'];
      state.lines = cats.map((c) => { const it = pickFrom(c); return lineFrom(it.id, it.deco[0], 1); });
      nodes.forEach((n) => n.row.remove());
      nodes.clear();
      render();
      toast('A fresh assortment, on the house');
    });

    $('#copyBtn').addEventListener('click', copyQuote);
    $('#printBtn').addEventListener('click', () => window.print());

    $('#quoteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#fName').value.trim(), company = $('#fCompany').value.trim(), email = $('#fEmail').value.trim();
      if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast('Add your name, company and a valid work email');
        (!name ? $('#fName') : !company ? $('#fCompany') : $('#fEmail')).focus();
        return;
      }
      if (!state.lines.length) { toast('Add at least one item to your kit first'); return; }
      const q = quote(state);
      const box = $('#confirmBox');
      box.innerHTML = `<strong>Configuration received.</strong><br>
        Reference <b>${refCode()}</b> — ${int(q.kits)} kits, ${state.lines.length} items, ${money(q.perKit)} per kit.
        A specialist will confirm stock and artwork and reply to <b>${email}</b>, usually the same business day.
        <span style="display:block;margin-top:8px;color:var(--ink-2);font-size:12.5px">Demo only — nothing left your browser.</span>`;
      box.classList.add('is-on');
      toast('Configuration sent to the desk');
    });
  }

  function quoteText() {
    const q = quote(state);
    const L = [];
    L.push('BOXWRIGHT CO. — CONFIGURATION ' + refCode());
    L.push(`${state.occasion} · ${int(q.kits)} kits · ${q.pkg.label}${state.rush ? ' · RUSH' : ''}`);
    L.push('');
    q.lines.forEach((l) => {
      L.push(`${l.item.name}  ×${l.ref.qty}/kit  (${int(l.units)} units, ${l.deco.label})  ${money(l.total)}`);
    });
    L.push('');
    L.push(`Goods, decoration & setup .... ${money(q.merch)}`);
    L.push(`Packaging & finishing ........ ${money(q.packaging + q.addons)}`);
    L.push(`Assembly & QC ................ ${money(q.assembly)}`);
    L.push(`Freight (${q.ship.label}) ..... ${money(q.freight)}`);
    if (q.rush) L.push(`Rush surcharge ............... +${money(q.rush)}`);
    if (q.discount) L.push(`Program discount ............. -${money(q.discount)}`);
    L.push(`PROGRAM TOTAL ................ ${money0(q.total)}`);
    L.push(`PER KIT, LANDED .............. ${money(q.perKit)}`);
    if (q.inHands) L.push(`Estimated in hands ........... ${fmtDate(q.inHands)} (${q.lead}d production + ${q.transit}d transit)`);
    L.push('');
    L.push('Estimate only. Excludes tax and duties.');
    return L.join('\n');
  }

  function copyQuote() {
    if (!state.lines.length) { toast('Nothing to copy yet'); return; }
    const text = quoteText();
    const done = () => toast('Quote copied to your clipboard');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback() {
      const ta = el('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed — select the summary instead'); }
      ta.remove();
    }
  }

  /* ── Boot ──────────────────────────────────────────────────────────────── */
  function boot() {
    buildThemeMenu();
    /* A host may stamp its own light/dark choice on <html data-theme> before we
       boot. Read it first — applyTheme is about to overwrite that attribute
       with a palette id, and the viewer's preference must survive it. */
    const stamped = document.documentElement.dataset.theme;
    const hostMode = (stamped === 'dark' || stamped === 'light') ? stamped : null;
    let savedTheme = null, savedMode = null;
    try { savedTheme = localStorage.getItem(STORE_THEME); savedMode = localStorage.getItem(STORE_MODE); } catch (e) {}
    applyTheme(savedTheme || seasonalDefault());
    applyMode(savedMode || hostMode || 'system');

    $('#themeBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      $('#themeMenu').hidden ? openMenu() : closeMenu();
    });
    document.addEventListener('click', (e) => {
      if (!$('#themeMenu').hidden && !e.target.closest('.picker')) closeMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    wireControls();
    if (!load()) loadDefaultBuild();
    syncControls();
    renderPresets();
    renderHero();
    buildFilters();
    renderCatalog();
    render();

    $('#year').textContent = String(new Date().getFullYear());
    $('#statItems').textContent = String(ITEMS.length);

    const header = $('.site-header');
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function loadDefaultBuild() {
    const p = byId(PRESETS, 'newhire');
    state.kits = p.kits; state.shipping = p.shipping; state.packaging = p.packaging;
    state.fill = p.fill; state.addons = p.addons.slice();
    state.lines = p.lines.map((l) => lineFrom(l.item, l.deco, l.qty));
  }

  /* Open on the palette that matches the month — the site should already look
     like the season the buyer is shopping for. */
  function seasonalDefault() {
    const m = new Date().getMonth() + 1;
    if (m === 12 || m === 11) return 'christmas';
    if (m === 2) return 'valentines';
    if (m === 3) return 'stpatricks';
    if (m === 4) return 'easter';
    if (m === 7) return 'july4';
    if (m === 10) return 'halloween';
    if (m === 9) return 'harvest';
    return 'signature';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
