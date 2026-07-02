// GeoMaker app shell: canvas lifecycle, render loop, state, sharing, export.
//
// UI model: the canvas is the app. A floating dock opens one bottom sheet at a
// time — Patterns (visual previews of every generator), Style (palette cards +
// finish), Tune (seed + the current pattern's controls) — so the artwork stays
// visible and live while you change anything.

import { createRng, randomSeedString } from './core/rng.js';
import { createNoise } from './core/noise.js';
import { PALETTES, getPalette } from './core/palettes.js';
import { adjustSaturation } from './core/util.js';
import { ALGORITHMS, algoById } from './algos/index.js';
import { buildControls } from './ui.js';

const STORAGE_KEY = 'geomaker-state-v1';

// global post-processing controls, applied on top of every algorithm
const LOOK_SCHEMA = [
  { key: 'sat', label: 'Saturation', type: 'range', min: 0, max: 1.5, step: 0.05, value: 1 },
  { key: 'weight', label: 'Line weight', type: 'range', min: 0.3, max: 3, step: 0.05, value: 1 },
  { key: 'grain', label: 'Paper grain', type: 'range', min: 0, max: 0.6, step: 0.02, value: 0 },
  { key: 'vignette', label: 'Vignette', type: 'range', min: 0, max: 0.5, step: 0.02, value: 0 },
  {
    key: 'sym', label: 'Touch symmetry — mirrors your drags like a kaleidoscope', type: 'chips', value: 'off',
    options: [
      { value: 'off', label: 'off' },
      { value: '2', label: '2×' },
      { value: '3', label: '3×' },
      { value: '4', label: '4×' },
      { value: '6', label: '6×' },
      { value: '8', label: '8×' },
      { value: '12', label: '12×' },
    ],
  },
];

const PANES = ['patterns', 'style', 'tune'];
const CATEGORIES = ['All', 'Organic', 'Geometric', 'Fractal', 'Saved'];

const canvas = document.getElementById('art');
const ctx = canvas.getContext('2d');
const fxCanvas = document.getElementById('fx');
const fxCtx = fxCanvas.getContext('2d');

const els = {
  showUi: document.getElementById('show-ui'),
  fav: document.getElementById('btn-fav'),
  immerse: document.getElementById('btn-immerse'),
  aboutBtn: document.getElementById('btn-about'),
  sheet: document.getElementById('sheet'),
  sheetGrab: document.getElementById('sheet-grab'),
  sheetScroller: document.getElementById('sheet-scroller'),
  panes: {
    patterns: document.getElementById('pane-patterns'),
    style: document.getElementById('pane-style'),
    tune: document.getElementById('pane-tune'),
  },
  tabs: {
    patterns: document.getElementById('tab-patterns'),
    style: document.getElementById('tab-style'),
    tune: document.getElementById('tab-tune'),
  },
  patternChips: document.getElementById('pattern-chips'),
  patternGrid: document.getElementById('pattern-grid'),
  favPane: document.getElementById('fav-pane'),
  favGrid: document.getElementById('fav-grid'),
  favEmpty: document.getElementById('fav-empty'),
  paletteGrid: document.getElementById('palette-grid'),
  look: document.getElementById('look-controls'),
  params: document.getElementById('param-controls'),
  tuneName: document.getElementById('tune-name'),
  algoDesc: document.getElementById('algo-desc'),
  algoHint: document.getElementById('algo-hint'),
  seed: document.getElementById('seed-input'),
  dice: document.getElementById('seed-dice'),
  regen: document.getElementById('btn-regen'),
  play: document.getElementById('btn-play'),
  link: document.getElementById('btn-link'),
  shuffle: document.getElementById('btn-shuffle'),
  save: document.getElementById('btn-save'),
  toast: document.getElementById('toast'),
  about: document.getElementById('about'),
  aboutClose: document.getElementById('about-close'),
};

const FAVS_KEY = 'geomaker-favs-v1';

// Optional public URL of the hosted web app. If set (e.g. a GitHub Pages /
// custom domain), the native Share action shares a real one-tap reproduce link;
// otherwise it shares a readable "recipe" of the piece.
const SHARE_BASE = '';

const state = {
  algoId: ALGORITHMS[0].id,
  seed: randomSeedString(),
  paletteName: PALETTES[0].name,
  params: {}, // per-algorithm overrides: { algoId: { key: value } }
  look: { sat: 1, weight: 1, grain: 0, vignette: 0, sym: 'off' },
};

// "Line weight" lever: scale every stroke width the generators set, without
// touching any generator code. Shadows lineWidth on the context instance with
// a scaling accessor — generators read back the value they set, while the
// real (prototype) accessor underneath receives the scaled width.
const nativeLineWidth = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'lineWidth');
function applyLineWeight(context, mul) {
  if (mul === 1) {
    delete context.lineWidth; // fall back to the untouched prototype accessor
    return;
  }
  let logical = nativeLineWidth.get.call(context);
  Object.defineProperty(context, 'lineWidth', {
    configurable: true,
    get: () => logical,
    set(v) {
      logical = v;
      nativeLineWidth.set.call(context, v * mul);
    },
  });
}

function adjustedPalette() {
  const base = getPalette(state.paletteName);
  if (state.look.sat === 1) return base;
  return {
    ...base,
    bg: adjustSaturation(base.bg, state.look.sat),
    colors: base.colors.map((c) => adjustSaturation(c, state.look.sat)),
  };
}

let instance = null;
let playing = false;
let finished = false;

function schemaDefaults(algo) {
  const out = {};
  for (const def of algo.params) out[def.key] = def.value;
  return out;
}

function currentParams(algo) {
  return { ...schemaDefaults(algo), ...(state.params[algo.id] || {}) };
}

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const c of [canvas, fxCanvas]) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

// Grain + vignette live on the #fx canvas (blend mode: overlay). Neutral gray
// (128) is a no-op under overlay, so grain speckles around 128 and the
// vignette pulls toward black at the edges.
function updateFx() {
  const { grain, vignette } = state.look;
  const w = fxCanvas.width;
  const h = fxCanvas.height;
  fxCtx.setTransform(1, 0, 0, 1, 0, 0);
  fxCtx.clearRect(0, 0, w, h);
  if (grain <= 0 && vignette <= 0) return;

  if (grain > 0) {
    const rng = createRng(`${state.seed}::fx`);
    const tile = document.createElement('canvas');
    tile.width = 192;
    tile.height = 192;
    const tctx = tile.getContext('2d');
    const img = tctx.createImageData(192, 192);
    for (let i = 0; i < img.data.length; i += 4) {
      const g = Math.max(0, Math.min(255, 128 + (rng.random() - 0.5) * 255 * grain));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
    fxCtx.fillStyle = fxCtx.createPattern(tile, 'repeat');
    fxCtx.fillRect(0, 0, w, h);
  } else {
    fxCtx.fillStyle = '#808080';
    fxCtx.fillRect(0, 0, w, h);
  }

  if (vignette > 0) {
    const r = Math.hypot(w, h) / 2;
    const grad = fxCtx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r * 1.05);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${vignette * 0.9})`);
    fxCtx.fillStyle = grad;
    fxCtx.fillRect(0, 0, w, h);
  }
}

function setPlayButton() {
  const label = finished ? 'Replay' : playing ? 'Pause' : 'Resume';
  els.play.textContent = label;
  els.play.title = `${label} (P)`;
}

function regenerate() {
  const algo = algoById(state.algoId);
  const { w, h } = fitCanvas();
  const palette = adjustedPalette();
  // namespace the seed per algorithm so switching algos gives fresh compositions
  const rng = createRng(`${state.seed}::${algo.id}`);
  const noise = createNoise(rng);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  applyLineWeight(ctx, state.look.weight);
  instance = algo.create({ ctx, width: w, height: h, rng, noise, palette, params: currentParams(algo) });
  finished = false;
  playing = true;
  canvas.style.cursor = algo.interactive ? 'crosshair' : 'default';
  setPlayButton();
  updateFx();
  updateHash();
  persist();
}

// ---- canvas pointer interaction (algorithms opt in via onDown/onMove/onUp) ----

let pointer = null;
function canvasXY(e) {
  const r = canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

// kaleidoscope input: replay a pointer event N ways around the canvas centre.
// Only algorithms that declare `symmetry: true` receive mirrored calls; the
// mirror index k lets them keep per-mirror drag state.
function forEachMirror(x, y, dx, dy, fn) {
  const algo = algoById(state.algoId);
  const N = algo.symmetry ? parseInt(state.look.sym, 10) || 1 : 1;
  if (N <= 1) {
    fn(x, y, dx, dy, 0);
    return;
  }
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let k = 0; k < N; k++) {
    const a = (k * 2 * Math.PI) / N;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    fn(
      cx + (x - cx) * cos - (y - cy) * sin,
      cy + (x - cx) * sin + (y - cy) * cos,
      dx * cos - dy * sin,
      dx * sin + dy * cos,
      k
    );
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (!instance || !(instance.onDown || instance.onMove || instance.onUp)) return;
  const [x, y] = canvasXY(e);
  pointer = { lastX: x, lastY: y, dist: 0, id: e.pointerId };
  canvas.setPointerCapture?.(e.pointerId);
  playing = true; // resume the loop so interactive redraws are shown
  haptic('LIGHT'); // tactile feedback for the touch interaction
  if (instance.onDown) forEachMirror(x, y, 0, 0, (xk, yk, _dx, _dy, k) => instance.onDown(xk, yk, k));
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointer || !instance) return;
  const [x, y] = canvasXY(e);
  const dx = x - pointer.lastX;
  const dy = y - pointer.lastY;
  pointer.dist += Math.hypot(dx, dy);
  pointer.lastX = x;
  pointer.lastY = y;
  if (instance.onMove) forEachMirror(x, y, dx, dy, (xk, yk, dxk, dyk, k) => instance.onMove(xk, yk, dxk, dyk, k));
});
function endPointer(e) {
  if (!pointer || !instance) return;
  const [x, y] = canvasXY(e);
  const dist = pointer.dist;
  if (instance.onUp) forEachMirror(x, y, 0, 0, (xk, yk, _dx, _dy, k) => instance.onUp(xk, yk, dist, k));
  pointer = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

function tick() {
  requestAnimationFrame(tick);
  if (playing && instance && !finished) {
    if (instance.frame() === false) {
      finished = true;
      playing = false;
      setPlayButton();
    }
  }
}

// ---- state <-> url hash / localStorage ----

function updateHash() {
  const algo = algoById(state.algoId);
  const qs = new URLSearchParams();
  qs.set('a', state.algoId);
  qs.set('s', state.seed);
  qs.set('p', state.paletteName);
  const params = currentParams(algo);
  for (const [k, v] of Object.entries(params)) qs.set('p_' + k, String(v));
  for (const def of LOOK_SCHEMA) qs.set('g_' + def.key, String(state.look[def.key]));
  history.replaceState(null, '', '#' + qs.toString());
}

function coerce(def, raw) {
  if (def.type === 'checkbox') return raw === 'true' || raw === '1';
  if (def.type === 'select' || def.type === 'chips') {
    return def.options.some((o) => String(o.value) === raw) ? raw : def.value;
  }
  const v = parseFloat(raw);
  if (Number.isNaN(v)) return def.value;
  return Math.min(def.max, Math.max(def.min, v));
}

function applySnapshot(snap) {
  if (!snap) return;
  if (snap.algoId && ALGORITHMS.some((a) => a.id === snap.algoId)) state.algoId = snap.algoId;
  if (snap.seed) state.seed = String(snap.seed);
  if (snap.paletteName && PALETTES.some((p) => p.name === snap.paletteName)) {
    state.paletteName = snap.paletteName;
  }
  if (snap.params && typeof snap.params === 'object') {
    for (const algo of ALGORITHMS) {
      const incoming = snap.params[algo.id];
      if (!incoming) continue;
      const clean = {};
      for (const def of algo.params) {
        if (incoming[def.key] !== undefined) clean[def.key] = coerce(def, String(incoming[def.key]));
      }
      state.params[algo.id] = clean;
    }
  }
  if (snap.look && typeof snap.look === 'object') {
    for (const def of LOOK_SCHEMA) {
      if (snap.look[def.key] !== undefined) state.look[def.key] = coerce(def, String(snap.look[def.key]));
    }
  }
}

function loadFromHash() {
  if (!location.hash || location.hash.length < 2) return false;
  const qs = new URLSearchParams(location.hash.slice(1));
  const algoId = qs.get('a');
  if (!algoId || !ALGORITHMS.some((a) => a.id === algoId)) return false;
  const algo = algoById(algoId);
  const params = {};
  for (const def of algo.params) {
    const raw = qs.get('p_' + def.key);
    if (raw !== null) params[def.key] = raw;
  }
  const look = {};
  for (const def of LOOK_SCHEMA) {
    const raw = qs.get('g_' + def.key);
    if (raw !== null) look[def.key] = raw;
  }
  applySnapshot({
    algoId,
    seed: qs.get('s') || state.seed,
    paletteName: qs.get('p') || state.paletteName,
    params: { [algoId]: params },
    look,
  });
  return true;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode etc. — persistence is optional */
  }
}

function restore() {
  try {
    applySnapshot(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    /* ignore corrupt state */
  }
}

// ---- ui wiring ----

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  els.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    els.toast.classList.remove('show');
    toast.timer = setTimeout(() => (els.toast.hidden = true), 300);
  }, 1800);
}

let regenTimer = 0;
function debounceRegen() {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(regenerate, 160);
}

function rebuildLookControls() {
  buildControls(els.look, LOOK_SCHEMA, state.look, (key, value) => {
    state.look[key] = value;
    if (key === 'sat') {
      // saturation is baked into the strokes, so re-render the art
      updatePaletteStripes();
      debounceRegen();
    } else if (key === 'weight') {
      // stroke thickness is baked into the drawing, so re-render too
      debounceRegen();
    } else if (key === 'sym') {
      // input-only setting: takes effect on the next touch, nothing to redraw
      updateHash();
      persist();
    } else {
      updateFx();
      updateHash();
      persist();
    }
  });
}

function rebuildParamControls() {
  const algo = algoById(state.algoId);
  els.tuneName.textContent = algo.name;
  els.algoDesc.textContent = algo.description;
  els.algoHint.textContent = algo.interactive && algo.hint ? `✦ ${algo.hint}` : '';
  els.algoHint.hidden = !(algo.interactive && algo.hint);
  if (!state.params[algo.id]) state.params[algo.id] = {};
  buildControls(els.params, algo.params, currentParams(algo), (key, value) => {
    state.params[algo.id][key] = value;
    debounceRegen();
  });
}

// ---- bottom sheet + dock ----

let activePane = null;

function openSheet(pane) {
  if (activePane === pane) {
    closeSheet();
    return;
  }
  activePane = pane;
  for (const p of PANES) {
    els.panes[p].hidden = p !== pane;
    els.tabs[p].classList.toggle('active', p === pane);
  }
  els.sheetScroller.scrollTop = 0; // each pane starts at its top
  els.sheet.classList.add('open');
  if (pane === 'patterns') {
    buildThumbs();
    renderFavs();
    markActiveThumb();
  }
}

function closeSheet() {
  activePane = null;
  els.sheet.classList.remove('open');
  for (const p of PANES) els.tabs[p].classList.remove('active');
}

// swipe the grab handle down (or just tap it) to dismiss the sheet
function wireSheetGrab() {
  let drag = null;
  els.sheetGrab.addEventListener('pointerdown', (e) => {
    drag = { y0: e.clientY, moved: 0 };
    els.sheetGrab.setPointerCapture?.(e.pointerId);
    els.sheet.classList.add('dragging');
    e.preventDefault();
  });
  els.sheetGrab.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    els.sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
  });
  const end = (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    const tap = drag.moved < 6;
    drag = null;
    els.sheet.classList.remove('dragging');
    els.sheet.style.transform = '';
    if (tap || dy > 64) closeSheet();
  };
  els.sheetGrab.addEventListener('pointerup', end);
  els.sheetGrab.addEventListener('pointercancel', end);
}

// ---- pattern browser (live previews of every generator) ----

let activeCat = 'All';
let gridBuilt = false;
let thumbSignature = ''; // palette+saturation the previews were rendered with
let thumbRun = 0;
const thumbTargets = []; // [algo, canvas] pairs, filled once at DOM build

function renderThumb(algo, cv) {
  const tctx = cv.getContext('2d');
  const w = cv.width;
  const h = cv.height;
  const palette = adjustedPalette();
  // fixed per-algo seed so the previews are stable across opens
  const rng = createRng(`thumb::${algo.id}`);
  const noise = createNoise(rng);
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.fillStyle = palette.bg;
  tctx.fillRect(0, 0, w, h);
  applyLineWeight(tctx, state.look.weight);
  try {
    const inst = algo.create({ ctx: tctx, width: w, height: h, rng, noise, palette, params: schemaDefaults(algo) });
    for (let i = 0; i < 34; i++) if (inst.frame() === false) break;
  } catch {
    /* a failed preview shouldn't break the browser */
  }
}

function buildPatternDom() {
  if (gridBuilt) return;
  gridBuilt = true;
  const groups = new Map();
  for (const algo of ALGORITHMS) {
    const cat = algo.category || 'Organic';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(algo);
  }
  for (const [cat, list] of groups) {
    const label = document.createElement('div');
    label.className = 'grid-label';
    label.dataset.cat = cat;
    label.textContent = cat;
    els.patternGrid.append(label);
    for (const algo of list) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'thumb';
      card.dataset.algo = algo.id;
      card.dataset.cat = cat;
      const cv = document.createElement('canvas');
      cv.width = 258;
      cv.height = 172;
      card.append(cv);
      if (algo.interactive) {
        const badge = document.createElement('span');
        badge.className = 'touch-badge';
        badge.textContent = '✦ touch';
        card.append(badge);
      }
      const name = document.createElement('div');
      name.className = 'thumb-name';
      name.textContent = algo.name;
      card.append(name);
      card.addEventListener('click', () => {
        const fresh = state.algoId !== algo.id;
        state.algoId = algo.id;
        rebuildParamControls();
        markActiveThumb();
        regenerate();
        haptic('LIGHT');
        // browsing stays open — the art redraws live behind the sheet
        if (fresh && algo.interactive && algo.hint) toast(`✦ ${algo.hint}`);
      });
      els.patternGrid.append(card);
      thumbTargets.push([algo, cv]);
    }
  }
  applyCatFilter();
}

function buildThumbs() {
  buildPatternDom();
  const sig = state.paletteName + '|' + state.look.sat + '|' + state.look.weight;
  if (thumbSignature === sig) return;
  thumbSignature = sig;
  // render one preview per animation frame so the sheet never janks; a new run
  // (palette changed mid-render) cancels the previous queue
  const run = ++thumbRun;
  const queue = thumbTargets.slice();
  const step = () => {
    if (run !== thumbRun) return;
    const item = queue.shift();
    if (!item) return;
    renderThumb(item[0], item[1]);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function markActiveThumb() {
  if (!gridBuilt) return;
  for (const card of els.patternGrid.querySelectorAll('.thumb')) {
    card.classList.toggle('active', card.dataset.algo === state.algoId);
  }
}

function applyCatFilter() {
  const saved = activeCat === 'Saved';
  els.favPane.hidden = !saved;
  els.patternGrid.hidden = saved;
  if (!saved) {
    for (const node of els.patternGrid.children) {
      node.hidden = activeCat !== 'All' && node.dataset.cat !== activeCat;
    }
  }
  for (const chip of els.patternChips.children) {
    chip.classList.toggle('active', chip.dataset.cat === activeCat);
  }
}

function buildCategoryChips() {
  for (const cat of CATEGORIES) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.cat = cat;
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      activeCat = cat;
      applyCatFilter();
      if (cat === 'Saved') renderFavs();
    });
    els.patternChips.append(chip);
  }
  applyCatFilter();
}

function updateFavChip() {
  const chip = els.patternChips.querySelector('[data-cat="Saved"]');
  if (!chip) return;
  const n = loadFavs().length;
  chip.textContent = n ? `Saved · ${n}` : 'Saved';
}

// ---- palette cards ----

const paletteStripes = []; // [{ span, color }] so saturation can retint them live

function buildPaletteGrid() {
  els.paletteGrid.textContent = '';
  paletteStripes.length = 0;
  for (const p of PALETTES) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pal-card';
    card.dataset.palette = p.name;
    const stripes = document.createElement('div');
    stripes.className = 'pal-stripes';
    for (const c of [p.bg, ...p.colors]) {
      const s = document.createElement('span');
      s.style.background = c;
      stripes.append(s);
      paletteStripes.push({ span: s, color: c });
    }
    const name = document.createElement('span');
    name.className = 'pal-name';
    name.textContent = p.name;
    card.append(stripes, name);
    card.addEventListener('click', () => {
      state.paletteName = p.name;
      markActivePalette();
      haptic('LIGHT');
      regenerate();
    });
    els.paletteGrid.append(card);
  }
  updatePaletteStripes();
  markActivePalette();
}

function markActivePalette() {
  for (const card of els.paletteGrid.querySelectorAll('.pal-card')) {
    card.classList.toggle('active', card.dataset.palette === state.paletteName);
  }
}

function updatePaletteStripes() {
  const sat = state.look.sat;
  for (const { span, color } of paletteStripes) {
    span.style.background = sat === 1 ? color : adjustSaturation(color, sat);
  }
}

// ---- favorites ----

function loadFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAVS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavs(favs) {
  try {
    localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
  } catch {
    /* storage full/unavailable — favorites are best-effort */
  }
}

function renderFavs() {
  const favs = loadFavs();
  els.favEmpty.hidden = favs.length > 0;
  els.favGrid.textContent = '';
  favs.forEach((fav, i) => {
    const card = document.createElement('div');
    card.className = 'thumb';
    const img = document.createElement('img');
    img.src = fav.img;
    img.alt = '';
    const name = document.createElement('div');
    name.className = 'thumb-name';
    const algo = algoById(fav.algoId);
    name.textContent = algo.name;
    const sub = document.createElement('small');
    sub.textContent = `${fav.seed} · ${fav.paletteName}`;
    name.append(sub);
    const del = document.createElement('button');
    del.className = 'thumb-del';
    del.textContent = '✕';
    del.title = 'Remove';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = loadFavs();
      cur.splice(i, 1);
      saveFavs(cur);
      renderFavs();
    });
    card.append(img, name, del);
    card.addEventListener('click', () => {
      applySnapshot(fav);
      syncUiFromState();
      regenerate();
    });
    els.favGrid.append(card);
  });
  updateFavChip();
}

function addFavorite() {
  const scale = 240 / canvas.width;
  const thumb = document.createElement('canvas');
  thumb.width = 240;
  thumb.height = Math.max(1, Math.round(canvas.height * scale));
  thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
  const favs = loadFavs();
  favs.unshift({
    algoId: state.algoId,
    seed: state.seed,
    paletteName: state.paletteName,
    params: { [state.algoId]: { ...(state.params[state.algoId] || {}) } },
    look: { ...state.look },
    img: thumb.toDataURL('image/jpeg', 0.72),
    t: Date.now(),
  });
  if (favs.length > 36) favs.length = 36;
  saveFavs(favs);
  updateFavChip();
  if (activePane === 'patterns') renderFavs();
  haptic('MEDIUM');
  els.fav.classList.remove('pop');
  void els.fav.offsetWidth; // restart the animation
  els.fav.classList.add('pop');
  setTimeout(() => els.fav.classList.remove('pop'), 900);
  toast('Saved — find it under Patterns → Saved');
}

function syncUiFromState() {
  els.seed.value = state.seed;
  markActivePalette();
  updatePaletteStripes();
  markActiveThumb();
  rebuildParamControls();
  rebuildLookControls();
}

function newSeed() {
  state.seed = randomSeedString();
  els.seed.value = state.seed;
  regenerate();
}

function surprise() {
  state.seed = randomSeedString();
  state.paletteName = PALETTES[Math.floor(Math.random() * PALETTES.length)].name;
  els.seed.value = state.seed;
  markActivePalette();
  regenerate();
}

// Capacitor injects window.Capacitor in the native app; undefined in a browser.
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

// subtle native haptic (no-op in a browser); .catch because impact() is async
function haptic(style = 'LIGHT') {
  if (!isNative()) return;
  window.Capacitor.Plugins.Haptics?.impact({ style }).catch(() => {});
}

function exportCanvas() {
  // returns the canvas to export, baking in grain/vignette if present
  if (state.look.grain <= 0 && state.look.vignette <= 0) return canvas;
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width;
  tmp.height = canvas.height;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(canvas, 0, 0);
  tctx.globalCompositeOperation = 'overlay';
  tctx.drawImage(fxCanvas, 0, 0);
  return tmp;
}

async function savePng() {
  const algo = algoById(state.algoId);
  const source = exportCanvas();
  const safeSeed = state.seed.replace(/[^a-z0-9_-]+/gi, '-');
  const filename = `geomaker-${algo.id}-${safeSeed}.png`;

  if (isNative()) {
    // native iOS: write to the cache, then open the share sheet (Save Image / Files / Messages…)
    try {
      const { Filesystem, Share } = window.Capacitor.Plugins;
      const base64 = source.toDataURL('image/png').split(',')[1];
      const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: 'CACHE' });
      await Share.share({ title: 'GeoMaker', text: filename, url: uri });
      toast('Ready to save / share');
    } catch (err) {
      if (err && /cancel/i.test(err.message || '')) return; // user dismissed the sheet
      toast('Export failed');
    }
    return;
  }

  // browser: download the PNG
  source.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  toast('PNG saved');
}

async function copyLink() {
  updateHash();
  const algo = algoById(state.algoId);
  // a human-readable "recipe" of the current piece
  const recipe = `GeoMaker — ${algo.name} · seed "${state.seed}" · ${state.paletteName}`;

  if (isNative()) {
    // native: open the iOS share sheet. capacitor://… isn't a shareable URL, so
    // share a real link only if a public web host is configured, else the recipe.
    try {
      const payload = { title: 'GeoMaker', text: recipe, dialogTitle: 'Share this pattern' };
      if (SHARE_BASE) payload.url = SHARE_BASE + location.hash;
      await window.Capacitor.Plugins.Share.share(payload);
    } catch (err) {
      if (!(err && /cancel/i.test(err.message || ''))) toast('Share failed');
    }
    return;
  }

  // browser: copy the reproducible URL to the clipboard
  try {
    await navigator.clipboard.writeText(location.href);
    toast('Link copied — same seed, same art');
  } catch {
    window.prompt('Copy this link:', location.href);
  }
}

// immersive mode: hide every piece of chrome so the artwork stands alone
function toggleChrome(show) {
  const showing = show ?? document.body.classList.contains('immersive');
  document.body.classList.toggle('immersive', !showing);
  els.showUi.hidden = showing;
  if (!showing) closeSheet();
}

function init() {
  restore();
  loadFromHash();

  buildCategoryChips();
  buildPaletteGrid();
  els.seed.value = state.seed;
  rebuildLookControls();
  rebuildParamControls();
  updateFavChip();
  if (isNative()) els.link.textContent = 'Share link';

  for (const p of PANES) {
    els.tabs[p].addEventListener('click', () => openSheet(p));
  }
  wireSheetGrab();

  const commitSeed = () => {
    const v = els.seed.value.trim();
    if (v && v !== state.seed) {
      state.seed = v;
      regenerate();
    }
  };
  els.seed.addEventListener('change', commitSeed);
  els.seed.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      commitSeed();
      els.seed.blur();
    }
  });
  els.dice.addEventListener('click', newSeed);
  els.shuffle.addEventListener('click', () => {
    haptic('LIGHT');
    surprise();
  });
  els.regen.addEventListener('click', regenerate);
  els.play.addEventListener('click', () => {
    if (finished) {
      regenerate();
    } else {
      playing = !playing;
      setPlayButton();
    }
  });
  els.save.addEventListener('click', savePng);
  els.link.addEventListener('click', copyLink);
  els.fav.addEventListener('click', addFavorite);
  els.immerse.addEventListener('click', () => toggleChrome(false));
  els.showUi.addEventListener('click', () => toggleChrome(true));

  const closeAbout = () => (els.about.hidden = true);
  els.aboutBtn.addEventListener('click', () => (els.about.hidden = false));
  els.aboutClose.addEventListener('click', closeAbout);
  els.about.addEventListener('click', (e) => {
    if (e.target === els.about) {
      closeAbout(); // click the scrim to dismiss
      return;
    }
    // open external http(s) links in the system browser when running natively
    // (mailto: links are left alone so iOS opens Mail)
    const ext = e.target.closest('a.ext-link');
    if (ext && isNative()) {
      e.preventDefault();
      window.open(ext.href, '_blank');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!els.about.hidden) closeAbout();
      else closeSheet();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (!els.about.hidden) return; // ignore shortcuts while the about panel is open
    if (e.key === ' ') {
      e.preventDefault();
      surprise();
    } else if (e.key === 'r') regenerate();
    else if (e.key === 'p') els.play.click();
    else if (e.key === 's') savePng();
    else if (e.key === 'c') copyLink();
    else if (e.key === 'h') toggleChrome();
    else if (e.key === 'g') openSheet('patterns');
    else if (e.key === 'f') addFavorite();
  });

  let resizeTimer = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        regenerate();
      }
    }, 250);
  });

  setupNative();
  regenerate();
  requestAnimationFrame(tick);
  window.__geomakerReady = true; // boot finished — silence the startup-error overlay
}

// native-only setup (no-ops in a plain browser): light status-bar text over our
// dark UI, and hide the splash once the first frame is ready.
// Note: StatusBar Style 'DARK' = "for dark backgrounds" (light text) — the
// naming is inverted from what you'd guess. setOverlaysWebView is Android-only,
// so it isn't called here; iOS full-bleed comes from viewport-fit=cover +
// contentInset "never". Plugin calls are promises, so failures are .catch()ed
// (a sync try/catch would miss them).
function setupNative() {
  if (!isNative()) return;
  const { StatusBar, SplashScreen } = window.Capacitor.Plugins;
  StatusBar?.setStyle?.({ style: 'DARK' }).catch(() => {});
  SplashScreen?.hide?.().catch(() => {});
  // long-press on the canvas shouldn't pop the iOS callout menu
  document.getElementById('art').addEventListener('contextmenu', (e) => e.preventDefault());
}

init();
