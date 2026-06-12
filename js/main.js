// GeoMaker app shell: canvas lifecycle, render loop, state, sharing, export.

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
  { key: 'grain', label: 'Paper grain', type: 'range', min: 0, max: 0.6, step: 0.02, value: 0 },
  { key: 'vignette', label: 'Vignette', type: 'range', min: 0, max: 0.5, step: 0.02, value: 0 },
];

const canvas = document.getElementById('art');
const ctx = canvas.getContext('2d');
const fxCanvas = document.getElementById('fx');
const fxCtx = fxCanvas.getContext('2d');

const els = {
  panel: document.getElementById('panel'),
  showUi: document.getElementById('show-ui'),
  hideUi: document.getElementById('hide-ui'),
  algo: document.getElementById('algo-select'),
  algoDesc: document.getElementById('algo-desc'),
  seed: document.getElementById('seed-input'),
  dice: document.getElementById('seed-dice'),
  palette: document.getElementById('palette-select'),
  swatches: document.getElementById('swatches'),
  look: document.getElementById('look-controls'),
  params: document.getElementById('param-controls'),
  shuffle: document.getElementById('btn-shuffle'),
  regen: document.getElementById('btn-regen'),
  play: document.getElementById('btn-play'),
  save: document.getElementById('btn-save'),
  link: document.getElementById('btn-link'),
  toast: document.getElementById('toast'),
};

const state = {
  algoId: ALGORITHMS[0].id,
  seed: randomSeedString(),
  paletteName: PALETTES[0].name,
  params: {}, // per-algorithm overrides: { algoId: { key: value } }
  look: { sat: 1, grain: 0, vignette: 0 },
};

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
  els.play.textContent = finished ? '↺' : playing ? '⏸' : '▶';
  els.play.title = finished ? 'Replay (P)' : playing ? 'Pause (P)' : 'Resume (P)';
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
  instance = algo.create({ ctx, width: w, height: h, rng, noise, palette, params: currentParams(algo) });
  finished = false;
  playing = true;
  setPlayButton();
  updateFx();
  updateHash();
  persist();
}

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
  if (def.type === 'select') {
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

function renderSwatches() {
  const palette = adjustedPalette();
  els.swatches.textContent = '';
  const chips = [palette.bg, ...palette.colors];
  for (const c of chips) {
    const chip = document.createElement('span');
    chip.className = 'swatch';
    chip.style.background = c;
    chip.title = c;
    els.swatches.append(chip);
  }
}

let regenTimer = 0;
function debounceRegen() {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(regenerate, 160);
}

function rebuildParamControls() {
  const algo = algoById(state.algoId);
  els.algoDesc.textContent = algo.description;
  if (!state.params[algo.id]) state.params[algo.id] = {};
  buildControls(els.params, algo.params, currentParams(algo), (key, value) => {
    state.params[algo.id][key] = value;
    debounceRegen();
  });
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
  els.palette.value = state.paletteName;
  renderSwatches();
  regenerate();
}

function savePng() {
  const algo = algoById(state.algoId);
  let source = canvas;
  if (state.look.grain > 0 || state.look.vignette > 0) {
    // bake the fx overlay into the export with the same blend the screen uses
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(canvas, 0, 0);
    tctx.globalCompositeOperation = 'overlay';
    tctx.drawImage(fxCanvas, 0, 0);
    source = tmp;
  }
  source.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safeSeed = state.seed.replace(/[^a-z0-9_-]+/gi, '-');
    a.download = `geomaker-${algo.id}-${safeSeed}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  toast('PNG saved');
}

async function copyLink() {
  updateHash();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied — same seed, same art');
  } catch {
    // clipboard API needs a secure context; fall back to a visible prompt
    window.prompt('Copy this link:', url);
  }
}

function togglePanel(show) {
  const showing = show ?? els.panel.hidden;
  els.panel.hidden = !showing;
  els.showUi.hidden = showing;
}

function init() {
  restore();
  loadFromHash();

  for (const algo of ALGORITHMS) {
    const o = document.createElement('option');
    o.value = algo.id;
    o.textContent = algo.name;
    els.algo.append(o);
  }
  for (const p of PALETTES) {
    const o = document.createElement('option');
    o.value = p.name;
    o.textContent = p.name;
    els.palette.append(o);
  }
  els.algo.value = state.algoId;
  els.palette.value = state.paletteName;
  els.seed.value = state.seed;
  renderSwatches();
  buildControls(els.look, LOOK_SCHEMA, state.look, (key, value) => {
    state.look[key] = value;
    if (key === 'sat') {
      // saturation is baked into the strokes, so re-render the art
      renderSwatches();
      debounceRegen();
    } else {
      updateFx();
      updateHash();
      persist();
    }
  });
  rebuildParamControls();

  els.algo.addEventListener('change', () => {
    state.algoId = els.algo.value;
    rebuildParamControls();
    regenerate();
  });
  els.palette.addEventListener('change', () => {
    state.paletteName = els.palette.value;
    renderSwatches();
    regenerate();
  });
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
  els.shuffle.addEventListener('click', surprise);
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
  els.hideUi.addEventListener('click', () => togglePanel(false));
  els.showUi.addEventListener('click', () => togglePanel(true));

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ') {
      e.preventDefault();
      surprise();
    } else if (e.key === 'r') regenerate();
    else if (e.key === 'p') els.play.click();
    else if (e.key === 's') savePng();
    else if (e.key === 'c') copyLink();
    else if (e.key === 'h') togglePanel();
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

  regenerate();
  requestAnimationFrame(tick);
}

init();
